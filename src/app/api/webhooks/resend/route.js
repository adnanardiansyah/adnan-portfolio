import { Resend } from 'resend';
import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, ApiError, text, email } from '@/lib/api';
export const POST = endpoint(async request => {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_WEBHOOK_SECRET) throw new ApiError(503, 'Email webhook is not configured');
  const payload = await request.text();
  if (new TextEncoder().encode(payload).length > 200000) throw new ApiError(413, 'Request too large');
  let event;
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({ payload,
      headers: { id: request.headers.get('svix-id'), timestamp: request.headers.get('svix-timestamp'), signature: request.headers.get('svix-signature') }, webhookSecret: process.env.RESEND_WEBHOOK_SECRET });
  } catch { throw new ApiError(401, 'Invalid webhook signature'); }
  if (event.type !== 'email.received') return json({ success: true, ignored: true });
  const sender = text(event.data?.from, 1000, true);
  const match = sender.match(/^(.*)<([^<>]+)>$/);
  const name = (match?.[1]?.trim().replace(/^"|"$/g, '') || sender).slice(0, 150);
  const address = email(match ? match[2] : sender);
  const message = 'SUBJECT: ' + text(event.data?.subject || 'No Subject', 1000) + '\n\n' + text(event.data?.text || event.data?.html || '[No content]', 100000);
  const key = '_webhook:' + text(request.headers.get('svix-id'), 200, true);
  await sql`WITH marker AS (INSERT INTO portfolio.settings (key, value) VALUES (${key}, 'true'::jsonb) ON CONFLICT (key) DO NOTHING RETURNING key)
    INSERT INTO portfolio.inquiries (name, email, message) SELECT ${name}, ${address}, ${message} FROM marker`;
  return json({ success: true });
});

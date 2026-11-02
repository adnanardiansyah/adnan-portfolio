import { Resend } from 'resend';
import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, bodyJson, sameOrigin, escapeHtml, ApiError } from '@/lib/api';
import { validateContact } from '@/lib/records';
import { rateLimit, requestIP } from '@/lib/rate-limit';
export const POST = endpoint(async request => {
  sameOrigin(request);
  const body = validateContact(await bodyJson(request, 20000));
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !process.env.ADMIN_EMAIL) throw new ApiError(503, 'Form kontak belum tersedia. Silakan hubungi Adnan melalui LinkedIn.');
  await rateLimit(request, 'contact', 3, 86400);
  await sql`INSERT INTO portfolio.inquiries (name, email, message, ip) VALUES (${body.name}, ${body.email}, ${body.message}, ${requestIP(request)})`;
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM_EMAIL, to: process.env.ADMIN_EMAIL, replyTo: body.email,
    subject: 'New portfolio message',
    html: '<h2>Portfolio contact</h2><p>' + escapeHtml(body.name) + ' &lt;' + escapeHtml(body.email) + '&gt;</p><p style="white-space:pre-wrap">' + escapeHtml(body.message) + '</p>',
  });
  if (error) throw new ApiError(502, 'Message saved, but email notification could not be sent. Please avoid resubmitting.');
  return json({ success: true });
});

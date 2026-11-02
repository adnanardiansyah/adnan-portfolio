import { Resend } from 'resend';
import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, requireAdmin, email, text, escapeHtml, ApiError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
export const POST = endpoint(async request => {
  await requireAdmin(request);
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) throw new ApiError(503, 'Email is not configured');
  if (Number(request.headers.get('content-length')) > 4000000) throw new ApiError(413, 'Attachment too large');
  const form = await request.formData();
  const to = email(form.get('to')), subject = text(form.get('subject'), 300, true), message = text(form.get('message'), 20000, true);
  const file = form.get('file');
  if (file && file.size > 3000000) throw new ApiError(413, 'Attachment too large');
  await rateLimit(request, 'admin-email', 20, 3600);
  const attachments = file && file.size ? [{ filename: text(file.name, 200, true), content: Buffer.from(await file.arrayBuffer()) }] : undefined;
  const { error, data } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM_EMAIL, to, subject, html: '<div style="white-space:pre-wrap">' + escapeHtml(message) + '</div>', attachments });
  if (error) throw new ApiError(502, 'Failed to send email');
  try { await sql`INSERT INTO portfolio.inquiries (name, email, message, read) VALUES ('Sent by Adnan Ardiansyah', ${to}, ${'SUBJECT: ' + subject + '\n\n' + message}, true)`; }
  catch { throw new ApiError(502, 'Email sent, but history could not be saved. Do not resend.'); }
  return json({ success: true, data });
});

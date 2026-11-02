import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, bodyJson, sameOrigin, email } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
export const POST = endpoint(async request => {
  sameOrigin(request);
  const address = email((await bodyJson(request, 2000)).email);
  await rateLimit(request, 'subscribe', 10, 3600);
  const rows = await sql`INSERT INTO portfolio.subscribers (email) VALUES (${address}) ON CONFLICT (email) DO NOTHING RETURNING id`;
  return json({ success: true, message: rows.length ? 'Subscribed successfully!' : 'Already subscribed!' }, rows.length ? 201 : 200);
});

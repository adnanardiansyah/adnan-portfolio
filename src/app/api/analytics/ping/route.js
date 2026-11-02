import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, id } from '@/lib/api';
import { analyticsBody, page } from '@/lib/analytics';
export const POST = endpoint(async request => {
  const body = await analyticsBody(request), session = id(body.sessionId), path = page(body.page);
  await sql`INSERT INTO portfolio.active_sessions (session_id, page) VALUES (${session}, ${path}) ON CONFLICT (session_id) DO UPDATE SET page = EXCLUDED.page, last_seen = now()`;
  const [row] = await sql`SELECT count(*)::integer AS count FROM portfolio.active_sessions WHERE last_seen > now() - interval '60 seconds'`;
  return json({ success: true, active: row.count });
});

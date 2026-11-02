import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const GET = endpoint(async () => {
  const [row] = await sql`SELECT count(*)::integer AS count FROM portfolio.active_sessions WHERE last_seen > now() - interval '60 seconds'`;
  return json({ count: row.count, success: true });
});

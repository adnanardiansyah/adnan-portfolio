import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, id } from '@/lib/api';
import { analyticsBody } from '@/lib/analytics';
export const POST = endpoint(async request => {
  const session = id((await analyticsBody(request)).sessionId);
  await sql`DELETE FROM portfolio.active_sessions WHERE session_id = ${session}`;
  return json({ success: true });
});

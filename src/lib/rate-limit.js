import 'server-only';
import { createHash } from 'node:crypto';
import { queryDatabase as sql } from './neon';
import { ApiError } from './api';

export function requestIP(request) {
  return (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown').slice(0, 100);
}
// Atomic fixed-window counter, shared across Vercel instances. Never public settings.
export async function rateLimit(request, bucket, limit, seconds) {
  const hash = createHash('sha256').update(requestIP(request)).digest('hex');
  const key = `_rate:${bucket}:${hash}`;
  const rows = await sql`
    INSERT INTO portfolio.settings AS s (key, value)
    VALUES (${key}, jsonb_build_object('count', 1, 'until', extract(epoch FROM now()) + ${seconds}::integer))
    ON CONFLICT (key) DO UPDATE SET value = CASE
      WHEN (s.value->>'until')::numeric <= extract(epoch FROM now())
      THEN jsonb_build_object('count', 1, 'until', extract(epoch FROM now()) + ${seconds}::integer)
      ELSE jsonb_set(s.value, '{count}', to_jsonb((s.value->>'count')::integer + 1)) END
    WHERE (s.value->>'until')::numeric <= extract(epoch FROM now()) OR (s.value->>'count')::integer < ${limit}
    RETURNING key`;
  if (!rows.length) throw new ApiError(429, 'Too many requests. Please try again later.');
}

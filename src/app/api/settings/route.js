import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, requireAdmin, bodyJson, ApiError } from '@/lib/api';
import { validateSettings } from '@/lib/records';
export const GET = endpoint(async request => {
  const key = new URL(request.url).searchParams.get('key');
  if (key && !['social_links', 'coming_soon'].includes(key)) throw new ApiError(404, 'Not found');
  const rows = await sql`SELECT key, value FROM portfolio.settings WHERE key IN ('social_links', 'coming_soon') AND (${key}::text IS NULL OR key = ${key})`;
  return json(key ? rows[0] || null : rows);
});
export const PATCH = endpoint(async request => {
  await requireAdmin(request);
  const { key, value } = validateSettings(await bodyJson(request, 20000));
  const rows = await sql`INSERT INTO portfolio.settings (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key, value`;
  return json(rows[0]);
});

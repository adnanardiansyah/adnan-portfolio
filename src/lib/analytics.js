import 'server-only';
import { queryDatabase as sql } from './neon';
import { bodyJson, sameOrigin, text, url } from './api';
import { rateLimit } from './rate-limit';
export async function analyticsBody(request) {
  sameOrigin(request);
  const body = await bodyJson(request, 8000);
  await rateLimit(request, 'analytics', 120, 60);
  return body;
}
export async function recordSearch(value) {
  const query = text(value, 300, true).toLowerCase();
  if (query.length < 2) return;
  await sql`INSERT INTO portfolio.searches (query) VALUES (${query}) ON CONFLICT (query) DO UPDATE SET count = portfolio.searches.count + 1, last_searched = now()`;
}
export function page(value) { const result = text(value || '/', 1000, true); return result.startsWith('/') && !result.startsWith('//') ? result : '/'; }
export function referrer(value) { return value ? url(value) : ''; }

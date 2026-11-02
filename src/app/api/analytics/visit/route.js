import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, text } from '@/lib/api';
import { analyticsBody, recordSearch, page, referrer } from '@/lib/analytics';
import { requestIP } from '@/lib/rate-limit';
export const POST = endpoint(async request => {
  const body = await analyticsBody(request);
  const path = page(body.page), ref = referrer(body.referrer), source = text(body.source || '', 100);
  const country = text(request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || '', 100);
  const city = text(request.headers.get('x-vercel-ip-city') || '', 200);
  const agent = (request.headers.get('user-agent') || '').slice(0, 2000);
  await sql`INSERT INTO portfolio.visits (page, referrer, source, useragent, ip, country, city) VALUES (${path}, ${ref}, ${source}, ${agent}, ${requestIP(request)}, ${country}, ${city})`;
  if (ref) { const parsed = new URL(ref); if (/(^|\.)(google|bing|yahoo|duckduckgo)\./i.test(parsed.hostname)) { const query = parsed.searchParams.get('q') || parsed.searchParams.get('p'); if (query && query.length >= 2 && query.length <= 300) await recordSearch(query); } }
  return json({ success: true });
});

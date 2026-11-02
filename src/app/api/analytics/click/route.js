import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, text, url } from '@/lib/api';
import { analyticsBody, page } from '@/lib/analytics';
export const POST = endpoint(async request => {
  const body = await analyticsBody(request);
  const label = text(body.label, 300, true), link = body.url ? url(body.url, true) : '', path = page(body.page);
  await sql`INSERT INTO portfolio.ad_clicks (label, url, page) VALUES (${label}, ${link}, ${path})`;
  return json({ success: true });
});

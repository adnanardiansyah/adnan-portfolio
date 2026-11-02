import { queryDatabase as sql } from '@/lib/neon';
import { endpoint, json, requireAdmin, ApiError } from '@/lib/api';
const AI_SOURCE_SET = new Set(['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Copilot', 'Grok', 'Meta AI', 'You.com']);

const SOURCE_PARAM_MAP = {
  instagram: 'Instagram', whatsapp: 'WhatsApp', twitter: 'Twitter / X', x: 'Twitter / X',
  facebook: 'Facebook',  linkedin: 'LinkedIn',  youtube: 'YouTube',     reddit: 'Reddit',
  google: 'Google',      bing: 'Bing',           tiktok: 'TikTok',      pinterest: 'Pinterest',
  chatgpt: 'ChatGPT',   gemini: 'Gemini',        claude: 'Claude',      perplexity: 'Perplexity',
  copilot: 'Copilot',   grok: 'Grok',            meta: 'Meta AI',
};

function detectFromUA(ua) {
  if (!ua) return null;
  const u = ua.toLowerCase();
  if (u.includes('instagram'))                              return 'Instagram';
  if (u.includes('fban') || u.includes('fbav') || u.includes('fbios')) return 'Facebook';
  if (u.includes('whatsapp'))                               return 'WhatsApp';
  if (u.includes('tiktok') || u.includes('musical_ly'))    return 'TikTok';
  if (u.includes('snapchat'))                               return 'Snapchat';
  if (u.includes('twitterandroid') || u.includes('twitterios')) return 'Twitter / X';
  if (u.includes('telegrambot') || u.includes('telegram')) return 'Telegram';
  if (u.includes('linkedinapp'))                            return 'LinkedIn';
  if (u.includes('pinterest'))                              return 'Pinterest';
  if (u.includes('line/'))                                  return 'LINE';
  return null;
}

function resolveSource(source, referrer, userAgent) {
  if (source) {
    const mapped = SOURCE_PARAM_MAP[source.toLowerCase().trim()];
    if (mapped) return mapped;
    return source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
  }
  const fromRef = parseSource(referrer);
  if (fromRef !== 'Direct') return fromRef;
  return detectFromUA(userAgent) ?? 'Direct';
}

function parseSource(referrer) {
  if (!referrer) return 'Direct';
  try {
    const h = new URL(referrer).hostname.toLowerCase();
    // AI tools
    if (h === 'chatgpt.com' || h.includes('chat.openai.com'))  return 'ChatGPT';
    if (h.includes('gemini.google.com'))                        return 'Gemini';
    if (h === 'claude.ai')                                      return 'Claude';
    if (h.includes('perplexity.ai'))                            return 'Perplexity';
    if (h.includes('copilot.microsoft'))                        return 'Copilot';
    if (h === 'grok.com' || h.includes('grok.x.ai'))           return 'Grok';
    if (h === 'meta.ai')                                        return 'Meta AI';
    if (h === 'you.com')                                        return 'You.com';
    // Social & search
    if (h.includes('instagram') || h === 'l.instagram.com')    return 'Instagram';
    if (h.includes('google.'))    return 'Google';
    if (h.includes('bing.'))      return 'Bing';
    if (h.includes('yahoo.'))     return 'Yahoo';
    if (h.includes('duckduckgo.'))return 'DuckDuckGo';
    if (h.includes('linkedin.'))  return 'LinkedIn';
    if (h.includes('twitter.') || h.includes('t.co') || h === 'x.com') return 'Twitter / X';
    if (h.includes('facebook.') || h.includes('fb.com')) return 'Facebook';
    if (h.includes('youtube.'))   return 'YouTube';
    if (h.includes('reddit.'))    return 'Reddit';
    if (h.includes('whatsapp.'))  return 'WhatsApp';
    return new URL(referrer).hostname;
  } catch {
    return 'Direct';
  }
}

export const GET = endpoint(async request => {
  await requireAdmin(request);
  const params = new URL(request.url).searchParams, year = params.get('year'), month = params.get('month');
  if ((year && (!/^\d{4}$/.test(year) || +year < 2000 || +year > 2200)) || (month && (!year || !/^(?:[1-9]|1[0-2])$/.test(month)))) throw new ApiError(400, 'Invalid date filter');
  const start = year ? new Date(Date.UTC(+year, month ? +month - 1 : 0, 1)).toISOString() : null;
  const end = year ? new Date(Date.UTC(+year + (month ? 0 : 1), month ? +month : 0, 1)).toISOString() : null;
  const [counts, clicksByLabel, visitsByPage, sources, visitsByCountry, recentVisits, topSearches, visitsPerDay] = await Promise.all([
    sql`SELECT
      (SELECT count(*)::integer FROM portfolio.visits WHERE (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz)) AS "totalVisits",
      (SELECT count(*)::integer FROM portfolio.visits WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') AS "todayVisits",
      (SELECT count(*)::integer FROM portfolio.ad_clicks WHERE (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz)) AS "totalClicks",
      (SELECT count(*)::integer FROM portfolio.reviews WHERE (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz)) AS "totalReviews",
      (SELECT count(*)::integer FROM portfolio.active_sessions WHERE last_seen > now() - interval '60 seconds') AS "activeUsers"`,
    sql`SELECT label AS _id, count(*)::integer AS count, max(url) AS url FROM portfolio.ad_clicks WHERE (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz) GROUP BY label ORDER BY count DESC LIMIT 10`,
    sql`SELECT page AS _id, count(*)::integer AS count FROM portfolio.visits WHERE (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz) GROUP BY page ORDER BY count DESC`,
    sql`SELECT source, referrer, useragent, count(*)::integer AS count FROM portfolio.visits WHERE (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz) GROUP BY source, referrer, useragent`,
    sql`SELECT country, count(*)::integer AS count FROM portfolio.visits WHERE country <> '' AND (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz) GROUP BY country ORDER BY count DESC LIMIT 15`,
    sql`SELECT * FROM portfolio.visits WHERE (${start}::timestamptz IS NULL OR created_at >= ${start}::timestamptz) AND (${end}::timestamptz IS NULL OR created_at < ${end}::timestamptz) ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT query, count::integer, last_searched FROM portfolio.searches ORDER BY count DESC LIMIT 10`,
    sql`SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS _id, count(*)::integer AS count FROM portfolio.visits WHERE created_at >= now() - interval '7 days' GROUP BY 1 ORDER BY 1`,
  ]);
  const sourceCounts = new Map();
  for (const row of sources) { const source = resolveSource(row.source, row.referrer, row.useragent); sourceCounts.set(source, (sourceCounts.get(source) || 0) + row.count); }
  const visitsBySource = [...sourceCounts].map(([source, count]) => ({ source, count })).sort((a,b) => b.count - a.count);
  return json({ ...counts[0], clicksByLabel, visitsByPage, visitsBySource, aiVisits: visitsBySource.filter(row => AI_SOURCE_SET.has(row.source)), visitsByCountry, recentVisits: recentVisits.map(row => ({ ...row, createdAt: row.created_at })), topSearches, visitsPerDay });
});

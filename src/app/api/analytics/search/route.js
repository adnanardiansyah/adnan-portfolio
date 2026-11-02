import { endpoint, json, text, ApiError } from '@/lib/api';
import { analyticsBody, recordSearch } from '@/lib/analytics';
export const POST = endpoint(async request => {
  const body = await analyticsBody(request), query = text(body.query, 300, true);
  if (query.length < 2) throw new ApiError(400, 'Query too short');
  await recordSearch(query); return json({ success: true });
});

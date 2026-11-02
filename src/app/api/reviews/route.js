import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listReviews, getReviews, createReviews, updateReviews, deleteReviews } from '@/lib/repository';
import { validateRecord, mapReview } from '@/lib/records';
export const GET = endpoint(async request => {
  const params = new URL(request.url).searchParams;
  const all = params.get('all') === 'true';
  if (all) await requireAdmin(request);
  const category = params.get('category');
  if (category && category.length > 100) throw new ApiError(400, 'Invalid category');
  const rows = await listReviews(all, category && category !== 'All' ? category : null);
  return json(rows.map(mapReview));
});
export const POST = endpoint(async request => {
  await requireAdmin(request);
  const body = validateRecord('reviews', await bodyJson(request));
  const row = await createReviews(body);
  return json(mapReview(row), 201);
});

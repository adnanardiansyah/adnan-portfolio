import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listReviews, getReviews, createReviews, updateReviews, deleteReviews } from '@/lib/repository';
import { validateRecord, mapReview } from '@/lib/records';
export const GET = endpoint(async (request, context) => {
  const value = id((await context.params).id, true);
  const all = await isAdmin();
  const row = await getReviews(value, all);
  if (!row) throw new ApiError(404, 'Not found');
  return json(mapReview(row));
});
export const PATCH = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, true);
  const body = validateRecord('reviews', await bodyJson(request), true);
  const row = await updateReviews(value, body);
  if (!row) throw new ApiError(404, 'Not found');
  return json(mapReview(row));
});
export const DELETE = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, true);
  if (!(await deleteReviews(value))) throw new ApiError(404, 'Not found');
  return json({ success: true });
});

import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listInquiries, getInquiries, updateInquiries, deleteInquiries } from '@/lib/repository';
import { validateRecord } from '@/lib/records';
export const GET = endpoint(async (request, context) => {
  const value = id((await context.params).id, true);
  await requireAdmin(request);
  const all = await isAdmin();
  const row = await getInquiries(value, all);
  if (!row) throw new ApiError(404, 'Not found');
  return json(row);
});
export const PATCH = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, true);
  const body = validateRecord('inquiries', await bodyJson(request), true);
  const row = await updateInquiries(value, body);
  if (!row) throw new ApiError(404, 'Not found');
  return json(row);
});
export const DELETE = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, true);
  if (!(await deleteInquiries(value))) throw new ApiError(404, 'Not found');
  return json({ success: true });
});

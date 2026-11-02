import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listInquiries, getInquiries, updateInquiries, deleteInquiries } from '@/lib/repository';
import { validateRecord } from '@/lib/records';
export const GET = endpoint(async request => {
  await requireAdmin(request);
  const params = new URL(request.url).searchParams;
  const all = params.get('all') === 'true';
  if (all) await requireAdmin(request);
  const category = params.get('category');
  if (category && category.length > 100) throw new ApiError(400, 'Invalid category');
  const rows = await listInquiries(all, category && category !== 'All' ? category : null);
  return json(rows);
});

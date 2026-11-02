import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listWorks, getWorks, createWorks, updateWorks, deleteWorks } from '@/lib/repository';
import { validateRecord, mapWork } from '@/lib/records';
import { projects, isRetiredProject } from '@/lib/profile';
export const GET = endpoint(async request => {
  const params = new URL(request.url).searchParams;
  const all = params.get('all') === 'true';
  if (all) await requireAdmin(request);
  const category = params.get('category');
  if (category && category.length > 100) throw new ApiError(400, 'Invalid category');
  try {
    const rows = await listWorks(all, category && category !== 'All' ? category : null);
    return json(rows.filter(row => !isRetiredProject(row)).map(mapWork), 200, { 'X-Portfolio-Source': 'neon' });
  } catch {
    if (all) throw new Error();
    return json(projects.filter(row => !category || category === 'All' || row.category === category), 200, { 'X-Portfolio-Source': 'fallback' });
  }
});
export const POST = endpoint(async request => {
  await requireAdmin(request);
  const body = validateRecord('works', await bodyJson(request));
  const row = await createWorks(body);
  return json(mapWork(row), 201);
});

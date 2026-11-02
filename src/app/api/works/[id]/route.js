import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listWorks, getWorks, createWorks, updateWorks, deleteWorks } from '@/lib/repository';
import { validateRecord, mapWork } from '@/lib/records';
import { projects, isRetiredProject } from '@/lib/profile';
export const GET = endpoint(async (request, context) => {
  const value = id((await context.params).id, false);
  const all = await isAdmin();
  if (isRetiredProject({ id: value })) throw new ApiError(404, 'Not found');
  let row;
  try { row = await getWorks(value, all); }
  catch {
    if (all) throw new Error();
    row = projects.find(project => project.id === value);
    if (row) return json(row, 200, { 'X-Portfolio-Source': 'fallback' });
    throw new ApiError(503, 'Service temporarily unavailable');
  }
  if (!row || isRetiredProject(row)) throw new ApiError(404, 'Not found');
  return json(mapWork(row));
});
export const PATCH = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, false);
  const body = validateRecord('works', await bodyJson(request), true);
  const row = await updateWorks(value, body);
  if (!row) throw new ApiError(404, 'Not found');
  return json(mapWork(row));
});
export const DELETE = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, false);
  if (!(await deleteWorks(value))) throw new ApiError(404, 'Not found');
  return json({ success: true });
});

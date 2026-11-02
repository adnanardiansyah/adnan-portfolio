import { isRetiredProject } from '@/lib/profile';
import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listProjects, getProjects, createProjects, updateProjects, deleteProjects } from '@/lib/repository';
import { validateRecord } from '@/lib/records';
export const GET = endpoint(async (request, context) => {
  const value = id((await context.params).id, false);
  const all = await isAdmin();
  const row = await getProjects(value, all);
  if (!row || isRetiredProject(row)) throw new ApiError(404, 'Not found');
  return json(row);
});
export const PATCH = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, false);
  const body = validateRecord('projects', await bodyJson(request), true);
  const row = await updateProjects(value, body);
  if (!row) throw new ApiError(404, 'Not found');
  return json(row);
});
export const DELETE = endpoint(async (request, context) => {
  await requireAdmin(request);
  const value = id((await context.params).id, false);
  if (!(await deleteProjects(value))) throw new ApiError(404, 'Not found');
  return json({ success: true });
});

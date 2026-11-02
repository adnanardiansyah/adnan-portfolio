import { isRetiredProject } from '@/lib/profile';
import { endpoint, json, requireAdmin, isAdmin, bodyJson, id, ApiError } from '@/lib/api';
import { listProjects, getProjects, createProjects, updateProjects, deleteProjects } from '@/lib/repository';
import { validateRecord } from '@/lib/records';
export const GET = endpoint(async request => {
  const params = new URL(request.url).searchParams;
  const all = params.get('all') === 'true';
  if (all) await requireAdmin(request);
  const category = params.get('category');
  if (category && category.length > 100) throw new ApiError(400, 'Invalid category');
  const rows = await listProjects(all, category && category !== 'All' ? category : null);
  return json(rows.filter(row => !isRetiredProject(row)));
});
export const POST = endpoint(async request => {
  await requireAdmin(request);
  const body = validateRecord('projects', await bodyJson(request));
  const row = await createProjects(body);
  return json(row, 201);
});

import { profile, projects, isRetiredProject } from '@/lib/profile';
import { listWorks } from '@/lib/repository';
import { mapWork } from '@/lib/records';
import { json } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { const rows = await listWorks(false); return json({ profile, projects: rows.filter(row => !isRetiredProject(row)).map(mapWork) }); }
  catch { return json({ profile, projects }, 200, { 'X-Portfolio-Source': 'fallback' }); }
}

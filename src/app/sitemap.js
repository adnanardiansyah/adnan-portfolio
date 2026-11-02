import { SITE_URL, projects, isRetiredProject } from '@/lib/profile';
import { listWorks } from '@/lib/repository';
export const dynamic = 'force-dynamic';
export default async function sitemap() {
  if (!process.env.NEXT_PUBLIC_SITE_URL) return [];
  let rows;
  try { rows = await listWorks(false); } catch { rows = projects; }
  const paths = ['', '/about', '/projects', '/contact', ...rows.filter(row => !isRetiredProject(row)).map(row => '/project/' + row.id)];
  return [...new Set(paths)].map(path => ({ url: SITE_URL + path }));
}

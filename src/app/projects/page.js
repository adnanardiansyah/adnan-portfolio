import { profile } from '@/lib/profile';
import PageShell from '@/components/PageShell';
import View from '@/views/projects';
import { Suspense } from 'react';
export const metadata={title:'Projects',description:profile.description,alternates:{canonical:'/projects'}};
export default function Page(){return <PageShell><Suspense fallback={<p className="p-24">Loading projects…</p>}><View /></Suspense></PageShell>}

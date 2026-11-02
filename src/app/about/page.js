import { profile } from '@/lib/profile';
import PageShell from '@/components/PageShell';
import View from '@/views/about';

export const metadata={title:'About',description:profile.description,alternates:{canonical:'/about'}};
export default function Page(){return <PageShell><View /></PageShell>}

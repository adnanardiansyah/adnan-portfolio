import { profile } from '@/lib/profile';
import PageShell from '@/components/PageShell';
import View from '@/views/contact';

export const metadata={title:'Contact',description:profile.description,alternates:{canonical:'/contact'}};
export default function Page(){return <PageShell><View /></PageShell>}

import { profile } from '@/lib/profile';

export default function SeoContent() {
  return <div className="sr-only"><h2>{profile.name}</h2><p>{profile.description}</p><p>{profile.education}, {profile.institution}.</p></div>;
}

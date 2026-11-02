import { assets } from './assets';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const specializations = [
  'Full-Stack Web Development',
  'Artificial Intelligence & Machine Learning',
  'Computer Vision',
  'Computer Networking & Cybersecurity',
  'Cloud & Linux Administration',
];
export const profile = {
 name: 'Adnan Ardiansyah',
 description: 'Adnan Ardiansyah — Full-Stack Web Development, Artificial Intelligence & Machine Learning, Computer Vision, Computer Networking & Cybersecurity, and Cloud & Linux Administration.',
 specializations,
 github: 'https://github.com/adnanardiansyah',
 linkedin: 'https://www.linkedin.com/in/adnanardiansyah/',
 education: 'D-IV Computer Network Engineering Technology',
 institution: 'Politeknik Negeri Lhokseumawe',
};
export const projects = [
 {id:'snapnext', title:'SnapNext', link:'https://photobox-saas-main-ews1.vercel.app/', description:'A photo booth SaaS website presenting QRIS payment flows, instant printing, GIF creation, and digital galleries.', category:'Website', categoryLabel:'Photo booth · SaaS', linkLabel:'Visit website'},
 {id:'triase-net', title:'TRIASE-Net', link:'https://triase-net-rouge.vercel.app/', description:'A student complaint platform focused on secure communication, reporting, and follow-up across campus services.', category:'Website', categoryLabel:'Student services', linkLabel:'Visit website'},
 {id:'suara-digital-desa', title:'Suara Digital Desa', link:'https://suges-privacy-policy.vercel.app/', description:'A village budget transparency platform presenting APBDes information, public participation, and privacy policies.', category:'Website', categoryLabel:'Village transparency', linkLabel:'Visit platform'},
 {id:'siskamling', title:'Siskamling Digital', link:null, description:'A digital neighborhood security project for patrol coordination, community reporting, and emergency communication. KMIPN 2026; a public demo URL has not been provided.', category:'App', categoryLabel:'App · KMIPN 2026', linkLabel:null},
].map((p,i)=>({...p, image_url:assets.projects[p.id].src, imageIsPlaceholder:assets.projects[p.id].isPlaceholder, imageFit:assets.projects[p.id].imageFit, gallery:assets.projects[p.id].gallery, galleryLayout:assets.projects[p.id].galleryLayout, visible:true, sort_order:i, tech:[]}));

// Retired entries may still exist in an optional CMS. Keep public views consistent.
export function isRetiredProject(project) {
  return /regal[\s_-]*stay/i.test([project?.id, project?.title, project?.text, project?.link].filter(Boolean).join(' '));
}

import { SiReact, SiNextdotjs, SiPython, SiJavascript, SiGit } from 'react-icons/si';
import { FiCpu, FiEye, FiShield, FiLayers, FiCloud } from 'react-icons/fi';
import { profile, specializations } from '@/lib/profile';
export const SECTION = {label:'01 / About me'};
export const HEADING = {line1:'Code.',line2:'Intelligence.',line3:'Connection.'};
export const BIO = [
 "I'm *Adnan Ardiansyah*. My focus connects *Full-Stack Web Development*, *Artificial Intelligence & Machine Learning*, and *Computer Vision* with *Computer Networking & Cybersecurity* and *Cloud & Linux Administration*.",
 "My education is *D-IV Computer Network Engineering Technology* at *Politeknik Negeri Lhokseumawe*. I explore how applications, intelligent systems, and networks can work together.",
 "This portfolio brings together SnapNext, TRIASE-Net, Suara Digital Desa, and Siskamling Digital — KMIPN 2026. Explore the projects and connect with me to discuss the work."
];
export const LINKEDIN_URL = profile.linkedin;
// Technologies shown as an exploration stack, without proficiency or years claims.
export const TECH = [{name:'React',icon:SiReact},{name:'Next.js',icon:SiNextdotjs},{name:'JavaScript',icon:SiJavascript},{name:'Python',icon:SiPython},{name:'Git',icon:SiGit}];
const expertiseIcons = [FiLayers, FiCpu, FiEye, FiShield, FiCloud];
export const CREATIVE = specializations.map((name, index) => ({name, icon:expertiseIcons[index]}));
export const EXPERIENCE = [{role:'Project experience',period:'SnapNext · TRIASE-Net · Suara Digital Desa'},{role:'Siskamling Digital',period:'KMIPN 2026 · Project'}];
export const EDUCATION = {degree:'D-IV Computer Network Engineering Technology',institution:'Politeknik Negeri Lhokseumawe'};

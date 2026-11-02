import { SITE_URL } from '@/lib/profile';
export default function robots(){return {rules:{userAgent:'*',allow:'/',disallow:['/admin/','/api/']},...(process.env.NEXT_PUBLIC_SITE_URL?{sitemap:SITE_URL+'/sitemap.xml'}:{})};}

import 'server-only';
import { ApiError, text, url, email } from './api';
import { isRetiredProject } from './profile';

export const workDefaults = { title: '', description: '', category: 'Website', category_label: '', tech: '', image_url: '', image_fit: 'cover', link: null, sort_order: 0, visible: true, client: '', year: '', services: '', month: '', logo_full_view_url: '', desktop_view_url: '', phone_view_url: '', gallery: [], gallery_layout: 'desktop', review: '', mobile_image_url: '', mainimageurl: '' };
export const projectDefaults = { title: '', description: '', category: 'Website', tech: '', photo_url: '', link: null, review: '', num: '', sort_order: 0, visible: true, gallery: [], client: '', month: '', year: '', logo_full_view_url: '', desktop_view_url: '', phone_view_url: '' };
export const reviewDefaults = { author: '', role: '', company: '', content: '', rating: 5, approved: true, avatar: '' };
export function validateRecord(kind, body, patch = false) {
  const defaults = kind === 'works' ? workDefaults : kind === 'projects' ? projectDefaults : kind === 'reviews' ? reviewDefaults : { read: false };
  if (!Object.keys(body).length || Object.keys(body).some(key => !Object.hasOwn(defaults, key))) throw new ApiError(400, 'Unknown or empty fields');
  const result = patch ? {} : { ...defaults };
  for (const [key, value] of Object.entries(body)) {
    if (['visible', 'approved', 'read'].includes(key)) {
      if (typeof value !== 'boolean') throw new ApiError(400, 'Invalid boolean');
      result[key] = value;
    } else if (key === 'sort_order' || key === 'rating') {
      if (!Number.isInteger(value) || (key === 'rating' ? value < 1 || value > 5 : Math.abs(value) > 1000000)) throw new ApiError(400, 'Invalid number');
      result[key] = value;
    } else if (key === 'gallery') {
      if (!Array.isArray(value) || value.length > 20) throw new ApiError(400, 'Invalid gallery');
      result[key] = value.map(item => url(item, true));
    } else if (key === 'image_fit' || key === 'gallery_layout') {
      if (!(key === 'image_fit' ? ['cover', 'contain'] : ['desktop', 'mobile']).includes(value)) throw new ApiError(400, 'Invalid image layout');
      result[key] = value;
    } else if (key === 'link') result[key] = value == null || value === '' ? null : url(value);
    else if (key.endsWith('_url') || key === 'avatar' || key === 'mainimageurl') result[key] = url(value, true);
    else result[key] = text(key === 'tech' && Array.isArray(value) ? value.join(', ') : value, ['description', 'content', 'review'].includes(key) ? 10000 : 1000);
  }
  if (!patch && !(kind === 'reviews' ? result.author && result.content : result.title)) throw new ApiError(400, 'Required fields are missing');
  if (['title', 'author', 'content', 'category'].some(key => Object.hasOwn(body, key) && !result[key])) throw new ApiError(400, 'Required field is empty');
  if (['works', 'projects'].includes(kind) && isRetiredProject(result)) throw new ApiError(400, 'This project has been retired');
  return result;
}
export function mapWork(row) {
  return { ...row, categoryLabel: row.category_label || row.category, imageFit: row.image_fit || 'cover', galleryLayout: row.gallery_layout || 'desktop', imageIsPlaceholder: !row.image_url };
}
export function mapReview(row) { return { ...row, _id: row.id, createdAt: row.created_at }; }
export function validateSettings(body) {
  if (Object.keys(body).some(key => !['key', 'value'].includes(key))) throw new ApiError(400, 'Unknown fields');
  if (body.key === 'coming_soon' && typeof body.value === 'boolean') return body;
  if (body.key === 'social_links' && body.value && typeof body.value === 'object' && !Array.isArray(body.value)) {
    const allowed = ['github', 'linkedin', 'instagram', 'twitter', 'youtube', 'facebook', 'whatsapp', 'behance', 'dribbble'];
    const value = {};
    for (const [key, link] of Object.entries(body.value)) {
      if (!allowed.includes(key)) throw new ApiError(400, 'Unknown social link');
      value[key] = url(link);
    }
    return { key: body.key, value };
  }
  throw new ApiError(400, 'Invalid setting');
}
export function validateContact(body) {
  return { name: text(body.name, 150, true), email: email(body.email), message: text(body.message, 10000, true) };
}

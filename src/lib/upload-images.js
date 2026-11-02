'use client';
import { validateImageFile } from './image-policy';

// A per-form batch retains successful URLs across DB failures and retries.
export function createImageBatch() {
  const selected = new Map(), uploaded = new Map();
  return {
    select(file) { validateImageFile(file); const preview = URL.createObjectURL(file); selected.set(preview, file); return preview; },
    async resolve(value) {
      if (!selected.has(value)) {
        if (value?.startsWith('blob:')) throw new Error('Preview tidak tersedia. Pilih ulang gambar.');
        return value;
      }
      if (uploaded.has(value)) return uploaded.get(value);
      const body = new FormData(); body.append('file', selected.get(value));
      const response = await fetch('/api/upload', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || 'Upload gagal. Pilihan gambar tetap tersedia untuk dicoba ulang.');
      uploaded.set(value, data.url);
      return data.url;
    },
    async resolveForm(form) {
      const result = { ...form };
      for (const key of ['image_url', 'logo_full_view_url', 'desktop_view_url', 'phone_view_url', 'mobile_image_url', 'mainimageurl']) if (typeof result[key] === 'string') result[key] = await this.resolve(result[key]);
      if (Array.isArray(result.gallery)) { result.gallery = []; for (const value of form.gallery) result.gallery.push(await this.resolve(value)); }
      return result;
    },
    reset() { for (const preview of selected.keys()) URL.revokeObjectURL(preview); selected.clear(); uploaded.clear(); },
  };
}

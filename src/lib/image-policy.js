export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');
export function validateImageFile(file) {
  if (!file || !IMAGE_TYPES.includes(file.type)) throw new Error('Hanya JPEG, PNG, dan WebP yang diizinkan.');
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error('Ukuran gambar harus 1 byte–3 MiB.');
}

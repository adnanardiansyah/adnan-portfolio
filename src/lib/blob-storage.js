import 'server-only';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { queryDatabase as sql } from './neon';
import { ApiError } from './api';
import { MAX_IMAGE_BYTES, validateImageFile } from './image-policy';

export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(process.env.BLOB_PUBLIC_HOSTNAME || ''));
}
export async function prepareImage(file) {
  try { validateImageFile(file); } catch (error) { throw new ApiError(400, error.message); }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, { limitInputPixels: 20000000, failOn: 'warning' });
    const metadata = await image.metadata();
    const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
    if (metadata.format !== formats[file.type] || (metadata.pages || 1) > 1) throw new Error();
    // Decode and re-encode: no cropping/resizing, EXIF stripped, orientation honored.
    const output = await image.rotate().webp({ quality: 90 }).toBuffer();
    if (output.length > MAX_IMAGE_BYTES) throw new ApiError(413, 'Gambar hasil konversi melebihi 3 MiB.');
    return output;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'Isi gambar tidak valid, terlalu besar, atau beranimasi.');
  }
}
export async function storeImage(buffer) {
  const pathname = `portfolio/projects/${randomUUID()}.webp`;
  const url = `https://${process.env.BLOB_PUBLIC_HOSTNAME}/${pathname}`;
  const key = `_blob:upload:${pathname}`;
  // Reserve before uploading. Even an interrupted upload has an auditable pathname.
  await sql`INSERT INTO portfolio.settings (key, value) VALUES (${key}, ${JSON.stringify({ pathname, url, state: 'reserved', createdAt: new Date().toISOString() })}::jsonb)`;
  try {
    const blob = await put(pathname, buffer, { access: 'public', contentType: 'image/webp', addRandomSuffix: false, allowOverwrite: false, token: process.env.BLOB_READ_WRITE_TOKEN });
    if (blob.url !== url) throw new Error();
    await sql`UPDATE portfolio.settings SET value = value || '{"state":"uploaded"}'::jsonb WHERE key = ${key}`;
    return { url: blob.url };
  } catch {
    // Never delete existing or newly uploaded images on an uncertain outcome.
    // The reserved ledger entry supports manual reconciliation against works.
    throw new ApiError(503, 'Upload belum dapat dipastikan berhasil. Coba lagi atau periksa catatan storage; proyek belum disimpan.');
  }
}

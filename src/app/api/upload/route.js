import { endpoint, json, requireAdmin, ApiError } from '@/lib/api';
import { blobConfigured, prepareImage, storeImage } from '@/lib/blob-storage';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const POST = endpoint(async request => {
  await requireAdmin(request);
  // Bound the entire multipart body, including requests without Content-Length.
  const maxRequest = 4 * 1024 * 1024;
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data;')) throw new ApiError(400, 'Gunakan multipart dengan satu file gambar.');
  if (Number(request.headers.get('content-length')) > maxRequest) throw new ApiError(413, 'Request melebihi 4 MiB.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'File tidak tersedia.');
  const chunks = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxRequest) { await reader.cancel(); throw new ApiError(413, 'Request melebihi 4 MiB.'); }
    chunks.push(value);
  }
  let form;
  try { form = await new Response(Buffer.concat(chunks), { headers: { 'content-type': request.headers.get('content-type') } }).formData(); }
  catch { throw new ApiError(400, 'Multipart tidak valid.'); }
  const entries = [...form.entries()];
  if (entries.length !== 1 || entries[0][0] !== 'file' || typeof entries[0][1] === 'string') throw new ApiError(400, 'Hanya satu field file diizinkan.');
  const buffer = await prepareImage(entries[0][1]);
  if (!blobConfigured()) throw new ApiError(503, 'Vercel Blob belum dikonfigurasi. Isi BLOB_READ_WRITE_TOKEN dan BLOB_PUBLIC_HOSTNAME di server.');
  await rateLimit(request, 'upload', 40, 3600);
  return json(await storeImage(buffer));
});

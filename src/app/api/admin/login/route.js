import { SignJWT } from 'jose';
import { createHash, timingSafeEqual } from 'node:crypto';
import { endpoint, json, bodyJson, sameOrigin, ApiError, text } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
export const POST = endpoint(async request => {
  sameOrigin(request);
  if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) throw new ApiError(503, 'Admin belum dikonfigurasi');
  const password = text((await bodyJson(request, 3000)).password, 1000, true);
  await rateLimit(request, 'login', 5, 900);
  const hash = value => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(hash(password), hash(process.env.ADMIN_PASSWORD))) throw new ApiError(401, 'Invalid password');
  const token = await new SignJWT({ admin: true }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(new TextEncoder().encode(process.env.JWT_SECRET));
  const response = json({ success: true });
  response.cookies.set('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 604800, path: '/' });
  return response;
});

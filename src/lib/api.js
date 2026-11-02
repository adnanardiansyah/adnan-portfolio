import 'server-only';
import { cookies } from 'next/headers';
import { verifyAdminToken } from './admin-token';
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export async function isAdmin() {
  const token = (await cookies()).get('admin_token')?.value;
  return verifyAdminToken(token);
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(request.url).origin)) {
    throw new ApiError(403, 'Forbidden');
  }
}
export async function requireAdmin(request) {
  if (!(await isAdmin())) throw new ApiError(401, 'Unauthorized');
  if (!['GET', 'HEAD'].includes(request.method)) sameOrigin(request);
}
export async function bodyJson(request, max = 100000) {
  if (Number(request.headers.get('content-length')) > max) throw new ApiError(413, 'Request too large');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > max) throw new ApiError(413, 'Request too large');
  try {
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error();
    return body;
  } catch { throw new ApiError(400, 'Invalid JSON'); }
}
export function json(data, status = 200, headers = {}) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
export function endpoint(handler) {
  return async (...args) => {
    try { return await handler(...args); }
    catch (error) {
      // Never serialize or log raw driver errors, input, URLs or credentials.
      return json({ error: error instanceof ApiError ? error.message : 'Service temporarily unavailable' }, error instanceof ApiError ? error.status : 503);
    }
  };
}
export function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new ApiError(400, 'Invalid input');
  return value.trim();
}
export function email(value) {
  const result = text(value, 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new ApiError(400, 'Invalid email');
  return result;
}
export function url(value, local = false) {
  const result = text(value, 2048);
  if (!result) return result;
  if (local && /^\/(?!\/)[^\\\s]*$/.test(result) && !result.includes('..')) return result;
  try {
    const parsed = new URL(result);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    return result;
  } catch { throw new ApiError(400, 'Invalid URL'); }
}
export function id(value, numeric = false) {
  if (typeof value !== 'string' || !(numeric ? /^[1-9][0-9]{0,17}$/ : /^[a-zA-Z0-9_-]{1,100}$/).test(value)) throw new ApiError(400, 'Invalid ID');
  return value;
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

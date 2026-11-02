import { jwtVerify } from 'jose';

// Edge-compatible verifier shared by middleware and server API authorization.
export async function verifyAdminToken(token) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), { algorithms: ['HS256'] });
    return payload.admin === true;
  } catch { return false; }
}

import { endpoint, json, requireAdmin, bodyJson, text, ApiError } from '@/lib/api';
export const POST = endpoint(async request => {
  await requireAdmin(request);
  const body = await bodyJson(request, 3000);
  if (text(body.currentPassword, 1000, true) !== process.env.ADMIN_PASSWORD) throw new ApiError(400, 'Current password is incorrect');
  if (text(body.newPassword, 1000, true).length < 8) throw new ApiError(400, 'New password must be at least 8 characters');
  return json({ success: true, message: 'Update ADMIN_PASSWORD privately in your environment and restart the server. No environment value has been changed.' });
});

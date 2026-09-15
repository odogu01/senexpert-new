import { NextRequest, NextResponse } from 'next/server';
import { getProfile, updateProfile, changePassword } from '@/services/authService';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const decoded = await requireActiveUser(request);
    if (isAuthFailure(decoded)) return decoded;

    const response = await getProfile(decoded.userId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const decoded = await requireActiveUser(request);
    if (isAuthFailure(decoded)) return decoded;

    const body = await request.json();

    // Handle password change separately
    if (body.action === 'change-password') {
      const response = await changePassword(decoded.userId, body.currentPassword, body.newPassword, getClientIp(request));
      return NextResponse.json(response);
    }

    const response = await updateProfile(decoded.userId, body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

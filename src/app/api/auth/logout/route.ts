import { NextRequest, NextResponse } from 'next/server';
import { logout as authLogout } from '@/services/authService';
import { isAuthFailure, requireActiveUser } from '@/lib/apiAuth';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const user = await requireActiveUser(request);
    if (isAuthFailure(user)) return user;
    await authLogout(user.userId, getClientIp(request));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ success: true });
  }
}

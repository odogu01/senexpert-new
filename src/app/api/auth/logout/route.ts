import { NextRequest, NextResponse } from 'next/server';
import { logout as authLogout, verifyToken } from '@/services/authService';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = await verifyToken(token);
      if (decoded) {
        await authLogout(decoded.userId, getClientIp(request));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ success: true });
  }
}

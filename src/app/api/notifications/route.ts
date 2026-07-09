import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notificationService';
import { verifyToken, getTokenFromHeader } from '@/services/authService';
import { applyRateLimit } from '@/lib/rateLimit';

async function authenticate(request: NextRequest): Promise<{ userId: string; role: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);
  if (!token) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  const decoded = await verifyToken(token);
  if (!decoded) return NextResponse.json({ success: false, error: { message: 'Invalid token' } }, { status: 401 });
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('count') === 'true';
    const limit = Number(searchParams.get('limit')) || 50;
    const skip = Number(searchParams.get('skip')) || 0;

    if (countOnly) {
      const response = await getUnreadCount(auth.userId);
      return NextResponse.json(response);
    }

    const response = await getNotifications(auth.userId, limit, skip);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      const response = await markAllNotificationsAsRead(auth.userId);
      return NextResponse.json(response);
    }

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Notification ID required' } }, { status: 400 });
    }

    const response = await markNotificationAsRead(id);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notifications API PATCH error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

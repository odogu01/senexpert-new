import { NextRequest, NextResponse } from 'next/server';
import { getAlerts as fetchAlerts } from '@/services/toolsService';
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

    const response = await fetchAlerts(false);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
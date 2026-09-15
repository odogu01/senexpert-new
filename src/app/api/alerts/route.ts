import { NextRequest, NextResponse } from 'next/server';
import { getAlerts as fetchAlerts } from '@/services/toolsService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';
import { roles } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const roleFailure = requireRole(auth, [...roles.dashboardReaders]);
    if (roleFailure) return roleFailure;

    const response = await fetchAlerts(false);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

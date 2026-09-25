import { NextRequest, NextResponse } from 'next/server';
import { getDevAuditLogs } from '@/services/toolsService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const roleFailure = requireRole(auth, ['dev']);
    if (roleFailure) return roleFailure;

    const limit = Number(request.nextUrl.searchParams.get('limit') || 200);
    return NextResponse.json(await getDevAuditLogs(limit));
  } catch (error) {
    console.error('Developer audit logs API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

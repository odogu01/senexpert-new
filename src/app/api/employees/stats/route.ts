import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeStats } from '@/services/employeeService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const limit = applyRateLimit(request);
    if (limit.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });
    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const denied = requireRole(auth, ['hr']);
    if (denied) return denied;
    return NextResponse.json(await getEmployeeStats());
  } catch (error) {
    console.error('Employee stats GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

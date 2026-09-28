import { NextRequest, NextResponse } from 'next/server';
import { getEmployee, updateEmployee } from '@/services/employeeService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';

type RouteContext = { params: Promise<{ id: string }> };

async function authorized(request: NextRequest) {
  const limit = applyRateLimit(request, { maxRequests: 60 });
  if (limit.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });
  const auth = await requireActiveUser(request);
  if (isAuthFailure(auth)) return auth;
  return requireRole(auth, ['hr']) || auth;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authorized(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await context.params;
    const result = await getEmployee(id);
    return NextResponse.json(result, { status: result.status || 200 });
  } catch (error) {
    console.error('Employee GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authorized(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await context.params;
    const result = await updateEmployee(id, await request.json());
    return NextResponse.json(result, { status: result.status || (result.success ? 200 : 400) });
  } catch (error) {
    console.error('Employee PATCH error:', error);
    return NextResponse.json({ success: false, error: { message: error instanceof Error && error.message.includes('encryption') ? error.message : 'Could not update employee' } }, { status: 500 });
  }
}

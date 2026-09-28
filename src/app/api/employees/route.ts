import { NextRequest, NextResponse } from 'next/server';
import { createEmployee, listEmployees } from '@/services/employeeService';
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
    const params = request.nextUrl.searchParams;
    return NextResponse.json(await listEmployees({ search: params.get('search') || '', department: params.get('department') || '', category: params.get('category') || '', status: params.get('status') || '', page: params.get('page'), pageSize: params.get('pageSize') }));
  } catch (error) {
    console.error('Employees GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limit = applyRateLimit(request, { maxRequests: 20 });
    if (limit.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });
    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const denied = requireRole(auth, ['hr']);
    if (denied) return denied;
    const result = await createEmployee(await request.json());
    return NextResponse.json(result, { status: result.status || (result.success ? 201 : 400) });
  } catch (error) {
    console.error('Employees POST error:', error);
    return NextResponse.json({ success: false, error: { message: error instanceof Error && error.message.includes('encryption') ? error.message : 'Could not create employee' } }, { status: 500 });
  }
}

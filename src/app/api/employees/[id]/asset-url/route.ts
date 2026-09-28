import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeAssetUrl } from '@/services/employeeService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const limit = applyRateLimit(request, { maxRequests: 30 });
    if (limit.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });
    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const denied = requireRole(auth, ['hr']);
    if (denied) return denied;
    const { id } = await context.params;
    const type = request.nextUrl.searchParams.get('type') === 'photo' ? 'photo' : 'document';
    const result = await getEmployeeAssetUrl(id, type, request.nextUrl.searchParams.get('documentId') || undefined);
    return NextResponse.json(result, { status: result.status || 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Employee asset URL error:', error);
    return NextResponse.json({ success: false, error: { message: 'Could not open file' } }, { status: 500 });
  }
}

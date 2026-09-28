import { NextRequest, NextResponse } from 'next/server';
import { deleteEmployeeDocument, saveUploadedEmployeeAsset } from '@/services/employeeService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const limit = applyRateLimit(request, { maxRequests: 50 });
    if (limit.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });
    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const denied = requireRole(auth, ['hr']);
    if (denied) return denied;
    const { id } = await context.params;
    const result = await saveUploadedEmployeeAsset(id, auth.userId, await request.json());
    return NextResponse.json(result, { status: result.status || (result.success ? 201 : 400) });
  } catch (error) {
    console.error('Employee document POST error:', error);
    return NextResponse.json({ success: false, error: { message: 'Could not save uploaded file' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const limit = applyRateLimit(request, { maxRequests: 30 });
    if (limit.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });
    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const denied = requireRole(auth, ['hr']);
    if (denied) return denied;
    const { id } = await context.params;
    const documentId = request.nextUrl.searchParams.get('documentId') || '';
    const result = await deleteEmployeeDocument(id, documentId);
    return NextResponse.json(result, { status: result.status || 200 });
  } catch (error) {
    console.error('Employee document DELETE error:', error);
    return NextResponse.json({ success: false, error: { message: 'Could not delete document' } }, { status: 500 });
  }
}

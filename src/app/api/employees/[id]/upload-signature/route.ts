import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryUploadSignature } from '@/services/employeeService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const limit = applyRateLimit(request, { maxRequests: 30 });
    if (limit.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });
    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const denied = requireRole(auth, ['hr']);
    if (denied) return denied;
    const { id } = await context.params;
    const body = await request.json();
    if (!['photo', 'document'].includes(body.kind)) return NextResponse.json({ success: false, error: { message: 'Invalid upload kind' } }, { status: 400 });
    const result = await getCloudinaryUploadSignature(id, body.kind);
    return NextResponse.json(result, { status: result.status || 200 });
  } catch (error) {
    console.error('Employee upload signature error:', error);
    return NextResponse.json({ success: false, error: { message: 'Cloudinary is not configured' } }, { status: 503 });
  }
}

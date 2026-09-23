import { NextRequest, NextResponse } from 'next/server';
import { getToolRequestById, editPendingToolRequest } from '@/services/toolsService';
import { validate, editPendingToolRequestSchema } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser } from '@/lib/apiAuth';
import { hasRole, roles } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;

    const { id } = await params;
    const response = await getToolRequestById(id);
    if (!response.success || !response.data) return NextResponse.json(response, { status: 404 });
    if (!hasRole(auth.role, roles.requestApprovers) && response.data.requested_by !== auth.userId) {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Request by ID API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    if (!hasRole(auth.role, roles.requestApprovers)) return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    const parsed = validate(editPendingToolRequestSchema, await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    const { id } = await params;
    const response = await editPendingToolRequest(id, parsed.data as any, auth.userId, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim());
    return NextResponse.json(response, { status: response.success ? 200 : 400 });
  } catch (error) {
    console.error('Tool Request edit API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

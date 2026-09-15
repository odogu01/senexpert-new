import { NextRequest, NextResponse } from 'next/server';
import { getToolRequests, createToolRequest, updateToolRequestStatus } from '@/services/toolsService';
import { validate, createToolRequestSchema, updateToolRequestSchema } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser, requireRole } from '@/lib/apiAuth';
import { hasRole, roles } from '@/lib/permissions';

function getClientIp(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || undefined;
}

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const canApprove = hasRole(auth.role, roles.requestApprovers);
    const canCreate = hasRole(auth.role, roles.requestCreators);
    if (!canApprove && !canCreate) return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const movement_type = searchParams.get('movement_type') || undefined;

    const response = await getToolRequests({ status, movement_type, requested_by: canApprove ? undefined : auth.userId });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Requests API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const roleFailure = requireRole(auth, [...roles.requestCreators]);
    if (roleFailure) return roleFailure;

    const body = await request.json();
    const parsed = validate(createToolRequestSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await createToolRequest(parsed.data as any, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Requests API create error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const roleFailure = requireRole(auth, [...roles.requestApprovers]);
    if (roleFailure) return roleFailure;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Request ID required' } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = validate(updateToolRequestSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await updateToolRequestStatus(id, parsed.data.status, auth.userId, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Requests API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

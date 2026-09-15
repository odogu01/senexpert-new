import { NextRequest, NextResponse } from 'next/server';
import { getFinancialRequests, createFinancialRequest, updateFinancialRequestStatus } from '@/services/toolsService';
import { validate, createFinancialRequestSchema, updateFinancialRequestSchema } from '@/lib/validation';
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
    const canReadAll = hasRole(auth.role, roles.financialApprovers);
    const canReadOwn = hasRole(auth.role, roles.financialCreators);
    if (!canReadAll && !canReadOwn) return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const requested_by = canReadAll ? (searchParams.get('requested_by') || undefined) : auth.userId;

    const response = await getFinancialRequests({ status, requested_by });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Financial Requests API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const roleFailure = requireRole(auth, [...roles.financialCreators]);
    if (roleFailure) return roleFailure;

    const body = await request.json();
    const parsed = validate(createFinancialRequestSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await createFinancialRequest(parsed.data as any, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Financial Requests API create error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;
    const roleFailure = requireRole(auth, [...roles.financialApprovers]);
    if (roleFailure) return roleFailure;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Request ID required' } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = validate(updateFinancialRequestSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await updateFinancialRequestStatus(id, parsed.data.status, auth.userId, parsed.data.notes, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Financial Requests API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

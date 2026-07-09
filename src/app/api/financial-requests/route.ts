import { NextRequest, NextResponse } from 'next/server';
import { getFinancialRequests, createFinancialRequest, updateFinancialRequestStatus } from '@/services/toolsService';
import { verifyToken, getTokenFromHeader } from '@/services/authService';
import { validate, createFinancialRequestSchema, updateFinancialRequestSchema } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';

async function authenticate(request: NextRequest): Promise<{ userId: string; role: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);
  if (!token) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  const decoded = await verifyToken(token);
  if (!decoded) return NextResponse.json({ success: false, error: { message: 'Invalid token' } }, { status: 401 });
  return decoded;
}

function getClientIp(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || undefined;
}

const ALLOWED_ROLES = ['super_admin', 'admin', 'accountant'];

function checkRole(role: string): NextResponse | null {
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;
    const roleCheck = checkRole(auth.role);
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const requested_by = searchParams.get('requested_by') || undefined;

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

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;
    const roleCheck = checkRole(auth.role);
    if (roleCheck) return roleCheck;

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

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;
    const roleCheck = checkRole(auth.role);
    if (roleCheck) return roleCheck;

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
    const response = await updateFinancialRequestStatus(id, parsed.data.status, parsed.data.approved_by, parsed.data.notes, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Financial Requests API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
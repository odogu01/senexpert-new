import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceRecords, createMaintenanceRecord, updateMaintenanceStatus } from '@/services/toolsService';
import { verifyToken, getTokenFromHeader } from '@/services/authService';
import { validate, createMaintenanceSchema, updateMaintenanceSchema } from '@/lib/validation';
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

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const tool_id = searchParams.get('tool_id') || undefined;

    const response = await getMaintenanceRecords({ status, tool_id });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Maintenance API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validate(createMaintenanceSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await createMaintenanceRecord(parsed.data as any, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Maintenance API create error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Maintenance ID required' } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = validate(updateMaintenanceSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await updateMaintenanceStatus(id, parsed.data.status, parsed.data.performed_by, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Maintenance API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getTools, getToolsPaginated, createTool, updateTool, deleteTool, getToolById, getCategories, getLocations } from '@/services/toolsService';
import { verifyToken, getTokenFromHeader } from '@/services/authService';
import { validate, createToolSchema, updateToolSchema } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';

function getClientIp(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || undefined;
}

async function authenticate(request: NextRequest): Promise<{ userId: string; role: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);
  if (!token) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const decoded = await verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ success: false, error: { message: 'Invalid token' } }, { status: 401 });
  }
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const location = searchParams.get('location') || undefined;
    const id = searchParams.get('id') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const sort = searchParams.get('sort') || undefined;
    const lowStock = searchParams.get('lowStock') === 'true' || undefined;

    // Get single tool by ID
    if (id) {
      const response = await getToolById(id);
      return NextResponse.json(response);
    }

    // Get categories
    if (searchParams.get('categories') === 'true') {
      const response = await getCategories();
      return NextResponse.json(response);
    }

    // Get distinct locations
    if (searchParams.get('locations') === 'true') {
      const response = await getLocations();
      return NextResponse.json(response);
    }

    // Paginated mode — when page or limit is explicitly provided
    if (page !== undefined || limit !== undefined) {
      const response = await getToolsPaginated({ category, status, location, search, page, limit, sort, lowStock });
      return NextResponse.json(response);
    }

    // Get all tools with filters (backward-compatible)
    const response = await getTools({ category, status, location, search, lowStock });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API error:', error);
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
    const parsed = validate(createToolSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await createTool(parsed.data as any, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API create error:', error);
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
      return NextResponse.json({ success: false, error: { message: 'Tool ID required' } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = validate(updateToolSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: parsed.error } }, { status: 400 });
    }
    const response = await updateTool(id, parsed.data as any, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 30 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Tool ID required' } }, { status: 400 });
    }

    const response = await deleteTool(id, auth.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API delete error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
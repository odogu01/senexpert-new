import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, deleteUser, resetUserPassword, verifyToken } from '@/services/authService';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const response = await getUsers();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 20 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const body = await request.json();
    const response = await createUser(body, decoded.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 20 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: { message: 'User ID required' } }, { status: 400 });
    }

    let response;
    if (action === 'reset-password') {
      const body = await request.json();
      response = await resetUserPassword(userId, body.newPassword, decoded.userId, getClientIp(request));
    } else {
      return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Users PATCH error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 20 });
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: { message: 'User ID required' } }, { status: 400 });
    }

    const response = await deleteUser(userId, decoded.userId, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Users DELETE error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
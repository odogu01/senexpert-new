import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser } from '@/services/authService';
import { verifyToken } from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
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
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const body = await request.json();
    const response = await createUser(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
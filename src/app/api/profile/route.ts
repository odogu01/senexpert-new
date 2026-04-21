import { NextRequest, NextResponse } from 'next/server';
import { getProfile, updateProfile, getUsers } from '@/services/authService';
import { verifyToken } from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { message: 'Invalid token' } }, { status: 401 });
    }

    const response = await getProfile(decoded.userId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { message: 'Invalid token' } }, { status: 401 });
    }

    const body = await request.json();
    const response = await updateProfile(decoded.userId, body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceRecords, createMaintenanceRecord, updateMaintenanceStatus } from '@/services/toolsService';

function getClientIp(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || undefined;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

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
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const response = await createMaintenanceRecord(body, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Maintenance API create error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Maintenance ID required' } }, { status: 400 });
    }

    const body = await request.json();
    const response = await updateMaintenanceStatus(id, body.status, body.performed_by, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Maintenance API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getToolRequests, createToolRequest, updateToolRequestStatus } from '@/services/toolsService';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const movement_type = searchParams.get('movement_type') || undefined;

    const response = await getToolRequests({ status, movement_type });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Requests API error:', error);
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
    const response = await createToolRequest(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Requests API create error:', error);
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
      return NextResponse.json({ success: false, error: { message: 'Request ID required' } }, { status: 400 });
    }

    const body = await request.json();
    const response = await updateToolRequestStatus(id, body.status, body.approved_by);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Requests API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
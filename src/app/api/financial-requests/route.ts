import { NextRequest, NextResponse } from 'next/server';
import { getFinancialRequests, createFinancialRequest, updateFinancialRequestStatus } from '@/services/toolsService';

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
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const response = await createFinancialRequest(body, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Financial Requests API create error:', error);
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
    const response = await updateFinancialRequestStatus(id, body.status, body.approved_by, body.notes, getClientIp(request));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Financial Requests API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
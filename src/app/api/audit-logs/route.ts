import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/services/toolsService';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const response = await getAuditLogs();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getToolRequestById } from '@/services/toolsService';
import { applyRateLimit } from '@/lib/rateLimit';
import { isAuthFailure, requireActiveUser } from '@/lib/apiAuth';
import { hasRole, roles } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = applyRateLimit(request);
    if (rl.blocked) return NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 });

    const auth = await requireActiveUser(request);
    if (isAuthFailure(auth)) return auth;

    const { id } = await params;
    const response = await getToolRequestById(id);
    if (!response.success || !response.data) return NextResponse.json(response, { status: 404 });
    if (!hasRole(auth.role, roles.requestApprovers) && response.data.requested_by !== auth.userId) {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool Request by ID API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

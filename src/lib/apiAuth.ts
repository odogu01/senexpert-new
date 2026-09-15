import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeader, verifyActiveToken } from '@/services/authService';
import type { UserRole } from '@/lib/database.types';

export interface ActiveApiUser {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * The single authentication boundary for route handlers.  Do not rely on a
 * decoded JWT alone: a user may have been disabled, deleted, or logged out
 * since that token was issued.
 */
export async function requireActiveUser(request: NextRequest): Promise<ActiveApiUser | NextResponse> {
  const token = getTokenFromHeader(request.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const user = await verifyActiveToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: { message: 'Session is invalid or has expired' } }, { status: 401 });
  }
  return user;
}

export function isAuthFailure(value: ActiveApiUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function requireRole(user: ActiveApiUser, roles: UserRole[]): NextResponse | null {
  if (roles.includes(user.role)) return null;
  return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
}

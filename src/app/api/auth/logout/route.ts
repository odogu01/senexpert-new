import { NextRequest, NextResponse } from 'next/server';
import { logout as authLogout, verifyToken } from '@/services/authService';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = await verifyToken(token);
      if (decoded) {
        // Log the logout event
        await authLogout();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    // Even if server-side logout fails, client should still clear local state
    return NextResponse.json({ success: true });
  }
}

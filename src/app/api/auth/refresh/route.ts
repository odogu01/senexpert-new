import { NextRequest, NextResponse } from 'next/server';
import { refreshToken, isTokenExpiringSoon } from '@/services/authService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { message: 'No token provided' } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const expiringSoon = await isTokenExpiringSoon(token);

    // Only refresh if token is expiring soon, otherwise return the same token
    if (!expiringSoon) {
      return NextResponse.json({
        success: true,
        data: { token, refreshed: false },
      });
    }

    const response = await refreshToken(token);

    if (response.success && response.token) {
      return NextResponse.json({
        success: true,
        data: { token: response.token, refreshed: true },
      });
    }

    return NextResponse.json(
      { success: false, error: { message: response.error || 'Failed to refresh token' } },
      { status: 401 }
    );
  } catch (error) {
    console.error('Token refresh API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

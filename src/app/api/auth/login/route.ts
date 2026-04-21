import { NextRequest, NextResponse } from 'next/server';
import { login as authLogin } from '@/services/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    const response = await authLogin({ email, password });

    if (response.success && response.data) {
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            full_name: response.data.user.full_name,
            role: response.data.user.role,
          },
          token: response.data.token,
          profile: {
            id: response.data.profile.id,
            email: response.data.profile.email,
            full_name: response.data.profile.full_name,
            role: response.data.profile.role,
          },
        },
      });
    }

    return NextResponse.json(
      { success: false, error: response.error },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
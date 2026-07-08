import { NextRequest, NextResponse } from 'next/server';
import { login as authLogin } from '@/services/authService';
import { validate, loginSchema } from '@/lib/validation';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit';

// ============================================
// Route handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const rl = applyRateLimit(request, { maxRequests: 10, windowMs: 15 * 60 * 1000 });
    if (rl.blocked) {
      return NextResponse.json(
        { success: false, error: { message: 'Too many login attempts. Please try again later.' } },
        {
          status: 429,
          headers: {
            'Retry-After': '900',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await request.json();
    const parsed = validate(loginSchema, body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error } },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const ip = getClientIp(request);
    const response = await authLogin({ email: email.toLowerCase().trim(), password }, ip);

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
            avatar_url: (response.data.profile as unknown as { avatar_url?: string }).avatar_url,
          },
        },
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: response.error },
      {
        status: response.error?.status ?? 401,
        headers: {
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
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

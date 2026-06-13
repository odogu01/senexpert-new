import { NextRequest, NextResponse } from 'next/server';
import { login as authLogin } from '@/services/authService';

// ============================================
// Simple in-memory rate limiter
// ============================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - entry.count };
}

// Clean up stale entries every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }, 30 * 60 * 1000);
}

// ============================================
// Input sanitization
// ============================================
function sanitizeString(input: string): string {
  return input.replace(/[<>"'&]/g, '')
    .trim()
    .slice(0, 255); // Limit length
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// Route handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeString(email.toLowerCase());
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    const response = await authLogin({ email: sanitizedEmail, password });

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
          'X-RateLimit-Remaining': String(remaining),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: response.error },
      {
        status: response.error?.status ?? 401,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
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

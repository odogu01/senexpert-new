/**
 * Simple in-memory sliding window rate limiter.
 * Shared across all API routes.
 * Note: Resets on server restart — suitable for single-instance deployments.
 * For multi-instance, replace with Redis-based limiter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store) {
      if (now > val.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (typically IP address).
 *
 * @param key - Unique identifier (IP, userId, etc.)
 * @param opts - Configuration
 * @param opts.maxRequests - Max requests in the window (default: 60)
 * @param opts.windowMs - Window duration in ms (default: 60000 = 1 min)
 */
export function checkRateLimit(
  key: string,
  opts: { maxRequests?: number; windowMs?: number } = {},
): RateLimitResult {
  const { maxRequests = 60, windowMs = 60_000 } = opts;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from a NextRequest.
 */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';
}

/**
 * Apply rate limiting to a request. Returns rate limit status with remaining count.
 */
export function applyRateLimit(
  request: { headers: { get(name: string): string | null } },
  opts?: { maxRequests?: number; windowMs?: number },
): { blocked: boolean; remaining: number; resetAt: number } {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, opts);
  return { blocked: !result.allowed, remaining: result.remaining, resetAt: result.resetAt };
}

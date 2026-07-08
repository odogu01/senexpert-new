import { describe, it, expect } from 'vitest';

// Test the API response format consistency
describe('API Response Format', () => {
  it('success response shape is correct', () => {
    const successResponse = {
      success: true as const,
      data: { id: '123', name: 'test' },
    };
    expect(successResponse).toHaveProperty('success', true);
    expect(successResponse).toHaveProperty('data');
    expect(successResponse).not.toHaveProperty('error');
  });

  it('error response shape is correct', () => {
    const errorResponse = {
      success: false as const,
      error: { message: 'Something went wrong' },
    };
    expect(errorResponse).toHaveProperty('success', false);
    expect(errorResponse).toHaveProperty('error');
    expect(errorResponse).not.toHaveProperty('data');
  });

  it('error response can be a string', () => {
    const errorResponse = {
      success: false as const,
      error: 'Not authorized',
    };
    expect(errorResponse).toHaveProperty('error', 'Not authorized');
  });
});

describe('JWT Token Structure', () => {
  it('generates a valid JWT with correct structure', async () => {
    // Dynamically import jsonwebtoken (avoid bundling in client)
    const jwt = await import('jsonwebtoken');

    const secret = 'test-secret-key';
    const payload = { id: 'user-123', role: 'admin' };

    const token = jwt.default.sign(payload, secret, { expiresIn: '7d' });

    // Token should be a string with 3 parts separated by dots
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    // Verify the token
    const decoded = jwt.default.verify(token, secret) as { id: string; role: string };
    expect(decoded.id).toBe('user-123');
    expect(decoded.role).toBe('admin');
  });

  it('rejects token with wrong secret', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign({ id: 'user-123' }, 'correct-secret', { expiresIn: '7d' });
    expect(() => jwt.default.verify(token, 'wrong-secret')).toThrow();
  });

  it('rejects expired token', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign({ id: 'user-123' }, 'test-secret', { expiresIn: '0s' });
    // Small delay to ensure expiry
    await new Promise((r) => setTimeout(r, 10));
    expect(() => jwt.default.verify(token, 'test-secret')).toThrow(/expired/i);
  });
});

describe('Utility - locale date format', () => {
  it('formats date to en-GB locale correctly', () => {
    const date = new Date('2026-06-15T10:30:00Z');
    const formatted = date.toLocaleDateString('en-GB');
    expect(formatted).toBe('15/06/2026');
  });
});

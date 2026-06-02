/**
 * Low-level helpers for TanStack Query hooks.
 *
 * - getAuthHeaders() reads the JWT from localStorage every time (stateless).
 * - throwIfError() unwraps the API { success, data, error } envelope so that
 *   TanStack's isLoading / isError flags work naturally.
 */

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('senexpert_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Unwrap the standard API response envelope.
 * Throws if success is false, making TanStack's `error` and `isError` work.
 */
export function throwIfError<T>(
  response: { success: boolean; data?: T; error?: { message?: string } | string },
): T {
  if (!response.success) {
    const message =
      typeof response.error === 'string'
        ? response.error
        : response.error?.message ?? 'Request failed';
    throw new Error(message);
  }
  return response.data as T;
}

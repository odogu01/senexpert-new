'use client';

import { useEffect, useRef } from 'react';

/**
 * Automatically logs the user out after `timeoutMs` of inactivity.
 * Tracks mousedown, keydown, mousemove, scroll, touchstart, and click events.
 * Pass `enabled = false` to suspend the timer (e.g., during loading states).
 */
export function useAutoLogout(
  logout: () => Promise<void>,
  timeoutMs: number = 5 * 60 * 1000,
  enabled: boolean = true,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutRef = useRef(logout);
  logoutRef.current = logout; // always keep the latest reference

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'click'] as const;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const resetTimer = () => {
      clearTimer();
      timerRef.current = setTimeout(async () => {
        await logoutRef.current();
        window.location.href = '/login';
      }, timeoutMs);
    };

    resetTimer();

    events.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      clearTimer();
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [timeoutMs, enabled]);
}

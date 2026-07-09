'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { Notification } from '@/lib/database.types';

async function fetchNotifications(limit = 50, skip = 0): Promise<Notification[]> {
  const res = await fetch(`/api/notifications?limit=${limit}&skip=${skip}`, {
    headers: getAuthHeaders(),
  });
  return throwIfError<Notification[]>(await res.json());
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications?count=true', {
    headers: getAuthHeaders(),
  });
  return throwIfError<number>(await res.json());
}

export function useNotifications(limit = 50) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('senexpert_token') : null;
  return useQuery({
    queryKey: queryKeys.notifications.list(token || ''),
    queryFn: () => fetchNotifications(limit, 0),
    enabled: !!token,
    refetchInterval: 30_000, // poll every 30s for new notifications
  });
}

export function useUnreadCount() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('senexpert_token') : null;
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(token || ''),
    queryFn: fetchUnreadCount,
    enabled: !!token,
    refetchInterval: 15_000, // poll frequently for badge count
  });
}

export function useMarkNotificationAsRead() {
  const qc = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('senexpert_token') : null;
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const qc = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('senexpert_token') : null;
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications?all=true', {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

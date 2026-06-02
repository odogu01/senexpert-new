'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { Alert } from '@/lib/database.types';

async function fetchAlerts(unreadOnly = false): Promise<Alert[]> {
  const res = await fetch(`/api/alerts?unreadOnly=${unreadOnly}`, { headers: getAuthHeaders() });
  return throwIfError<Alert[]>(await res.json());
}

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.alerts.list(unreadOnly),
    queryFn: () => fetchAlerts(unreadOnly),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    refetchInterval: 60_000, // poll every minute for critical alerts
  });
}

export function useMarkAlertAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_read: true }),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts.all }),
  });
}

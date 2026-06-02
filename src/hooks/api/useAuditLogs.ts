'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { AuditLog } from '@/lib/database.types';

async function fetchRecentActivity(limit = 10): Promise<AuditLog[]> {
  const res = await fetch(`/api/audit-logs?limit=${limit}`, { headers: getAuthHeaders() });
  return throwIfError<AuditLog[]>(await res.json());
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(limit),
    queryFn: () => fetchRecentActivity(limit),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    refetchInterval: 30_000,
  });
}

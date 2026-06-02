'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';

export interface DashboardStats {
  totalTools: number;
  available: number;
  inUse: number;
  maintenance: number;
  lowStock: number;
  pendingRequests: number;
  upcomingMaintenance: number;
  pendingFinancialRequests: number;
  approvedFinancialRequests: number;
  totalFinancialAmount: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/tools/stats', { headers: getAuthHeaders() });
  return throwIfError<DashboardStats>(await res.json());
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: fetchDashboardStats,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    refetchInterval: 30_000, // auto-refresh every 30s
  });
}

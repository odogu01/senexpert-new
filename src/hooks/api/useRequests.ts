'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { ToolRequest, FinancialRequest } from '@/lib/database.types';

// ════════════════════════════════════════════
// TOOL REQUESTS
// ════════════════════════════════════════════

export interface ToolRequestFilters {
  status?: string;
  movement_type?: string;
}

async function fetchToolRequests(filters?: ToolRequestFilters): Promise<ToolRequest[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.movement_type) params.set('movement_type', filters.movement_type);
  const qs = params.toString();
  const res = await fetch(`/api/tool-requests${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  return throwIfError<ToolRequest[]>(await res.json());
}

export function useToolRequests(filters?: ToolRequestFilters) {
  return useQuery({
    queryKey: queryKeys.toolRequests.list(filters as Record<string, string | undefined>),
    queryFn: () => fetchToolRequests(filters),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

export function useCreateToolRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/tool-requests', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.toolRequests.all }),
  });
}

export function useUpdateToolRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, approved_by }: { id: string; status: string; approved_by?: string }) => {
      const res = await fetch(`/api/tool-requests?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, approved_by }),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.toolRequests.all });
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

// ════════════════════════════════════════════
// FINANCIAL REQUESTS
// ════════════════════════════════════════════

export interface FinancialRequestFilters {
  status?: string;
  requested_by?: string;
}

async function fetchFinancialRequests(filters?: FinancialRequestFilters): Promise<FinancialRequest[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.requested_by) params.set('requested_by', filters.requested_by);
  const qs = params.toString();
  const res = await fetch(`/api/financial-requests${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  return throwIfError<FinancialRequest[]>(await res.json());
}

export function useFinancialRequests(filters?: FinancialRequestFilters) {
  return useQuery({
    queryKey: queryKeys.financialRequests.list(filters as Record<string, string | undefined>),
    queryFn: () => fetchFinancialRequests(filters),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

export function useCreateFinancialRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/financial-requests', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financialRequests.all }),
  });
}

export function useUpdateFinancialRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, approved_by, notes }: { id: string; status: string; approved_by?: string; notes?: string }) => {
      const res = await fetch(`/api/financial-requests?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, approved_by, notes }),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financialRequests.all }),
  });
}

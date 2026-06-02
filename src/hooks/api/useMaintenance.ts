'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { Maintenance } from '@/lib/database.types';

export interface MaintenanceFilters {
  status?: string;
  tool_id?: string;
}

async function fetchMaintenance(filters?: MaintenanceFilters): Promise<Maintenance[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.tool_id) params.set('tool_id', filters.tool_id);
  const qs = params.toString();
  const res = await fetch(`/api/maintenance${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  return throwIfError<Maintenance[]>(await res.json());
}

export function useMaintenance(filters?: MaintenanceFilters) {
  return useQuery({
    queryKey: queryKeys.maintenance.list(filters as Record<string, string | undefined>),
    queryFn: () => fetchMaintenance(filters),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
  });
}

export function useUpdateMaintenanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, performed_by }: { id: string; status: string; performed_by?: string }) => {
      const res = await fetch(`/api/maintenance?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, performed_by }),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
  });
}

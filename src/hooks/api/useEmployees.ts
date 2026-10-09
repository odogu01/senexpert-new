'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders, queryKeys, throwIfError } from '@/lib/query';
import type { Employee } from '@/lib/database.types';

export interface EmployeeFilters { search?: string; department?: string; category?: string; status?: string; page?: number; pageSize?: number; }
export interface EmployeeList { items: Employee[]; total: number; page: number; pageSize: number; }
export interface EmployeeStats { total: number; active: number; on_leave: number; new_this_month: number; departments: Array<{ department: string; total: number }>; }

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: queryKeys.employees.list({ ...filters }),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
      const response = await fetch(`/api/employees?${params}`, { headers: getAuthHeaders() });
      return throwIfError<EmployeeList>(await response.json());
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: async () => throwIfError<Employee>(await (await fetch(`/api/employees/${id}`, { headers: getAuthHeaders() })).json()),
    enabled: !!id && typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

export function useEmployeeStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.stats,
    queryFn: async () => throwIfError<EmployeeStats>(await (await fetch('/api/employees/stats', { headers: getAuthHeaders() })).json()),
    enabled: enabled && typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    refetchInterval: 60_000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Partial<Employee>) => throwIfError<Employee>(await (await fetch('/api/employees', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(employee) })).json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees.all }),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Partial<Employee>) => throwIfError<Employee>(await (await fetch(`/api/employees/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(employee) })).json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
    },
  });
}

export function useEndEmployeeEngagement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: 'terminate_contract' | 'fire_staff' | 'resign_exit') => throwIfError<Employee>(await (await fetch(`/api/employees/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ employment_action: action }) })).json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
    },
  });
}

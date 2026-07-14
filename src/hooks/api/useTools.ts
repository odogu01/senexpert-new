'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { Tool, ToolStatus } from '@/lib/database.types';

// ───────── Queries ─────────

export interface ToolFilters {
  category?: string;
  status?: string;
  location?: string;
  search?: string;
}

export interface PaginatedFilters extends ToolFilters {
  location?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

async function fetchTools(filters?: ToolFilters): Promise<Tool[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.location) params.set('location', filters.location);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  const res = await fetch(`/api/tools${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  return throwIfError<Tool[]>(await res.json());
}

export function useTools(filters?: ToolFilters) {
  return useQuery({
    queryKey: queryKeys.tools.list(filters as Record<string, string | undefined>),
    queryFn: () => fetchTools(filters),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

// ───────── Paginated Query ─────────

interface PaginatedResult {
  data: Tool[];
  total: number;
}

async function fetchToolsPaginated(filters?: PaginatedFilters): Promise<PaginatedResult> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.location) params.set('location', filters.location);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.sort) params.set('sort', filters.sort);
  const qs = params.toString();
  const res = await fetch(`/api/tools${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) {
    const message =
      typeof json.error === 'string'
        ? json.error
        : json.error?.message ?? 'Request failed';
    throw new Error(message);
  }
  return { data: json.data ?? [], total: json.total ?? 0 };
}

export function useToolsPaginated(filters?: PaginatedFilters) {
  return useQuery({
    queryKey: [...queryKeys.tools.list(filters as Record<string, string | undefined>), 'paginated'],
    queryFn: () => fetchToolsPaginated(filters),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

async function fetchToolById(id: string): Promise<Tool> {
  const res = await fetch(`/api/tools?id=${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
  return throwIfError<Tool>(await res.json());
}

export function useToolById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tools.detail(id!),
    queryFn: () => fetchToolById(id!),
    enabled: !!id,
  });
}

async function fetchCategories(): Promise<string[]> {
  const res = await fetch('/api/tools?categories=true', { headers: getAuthHeaders() });
  return throwIfError<string[]>(await res.json());
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.tools.categories,
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // categories change rarely
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

async function fetchLocations(): Promise<string[]> {
  const res = await fetch('/api/tools?locations=true', { headers: getAuthHeaders() });
  return throwIfError<string[]>(await res.json());
}

export function useLocations() {
  return useQuery({
    queryKey: [...queryKeys.tools.all, 'locations'] as const,
    queryFn: fetchLocations,
    staleTime: 10 * 60 * 1000,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

// ───────── Mutations ─────────

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return throwIfError<Tool>(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tools.all }),
  });
}

export function useUpdateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/tools?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tools.all }),
  });
}

export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tools?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tools.all }),
  });
}

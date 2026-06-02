'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { User, UserRole } from '@/lib/database.types';

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users', { headers: getAuthHeaders() });
  return throwIfError<User[]>(await res.json());
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: fetchUsers,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string; full_name: string; role: UserRole }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useResetUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}&action=reset-password`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword }),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders, throwIfError } from '@/lib/query';
import type { UserRole } from '@/lib/database.types';

// ───────── Types ─────────

export interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active?: boolean;
  created_at: Date;
  updated_at?: Date;
}

// ───────── Profile ─────────

async function fetchProfile(): Promise<ProfileData> {
  const res = await fetch('/api/profile', { headers: getAuthHeaders() });
  return throwIfError<ProfileData>(await res.json());
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: fetchProfile,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { full_name?: string; avatar_url?: string }) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return throwIfError(await res.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile.all }),
  });
}

// ───────── Change Password ─────────

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'change-password', currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to change password');
      }
      return throwIfError(await res.json());
    },
  });
}

// ───────── Login / Logout ─────────

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Login failed');
      return json.data as { user: ProfileData; token: string; profile: ProfileData };
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return res.json();
    },
  });
}

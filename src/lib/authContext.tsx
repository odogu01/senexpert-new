'use client';

/**
 * Auth Context - Client-side authentication state management
 * Uses API routes for server-side operations
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserRole, Profile } from '@/lib/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function refreshStoredToken(): Promise<string | null> {
  try {
    const currentToken = localStorage.getItem('senexpert_token');
    if (!currentToken) return null;

    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      localStorage.setItem('senexpert_token', data.data.token);
      return data.data.token;
    }
    // Token invalid - clear everything
    if (!data.success) {
      localStorage.removeItem('senexpert_token');
      localStorage.removeItem('senexpert_user');
      localStorage.removeItem('senexpert_profile');
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('senexpert_token');
    const storedUser = localStorage.getItem('senexpert_user');
    const storedProfile = localStorage.getItem('senexpert_profile');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } catch {
        localStorage.removeItem('senexpert_token');
        localStorage.removeItem('senexpert_user');
        localStorage.removeItem('senexpert_profile');
      }
    }
    setIsLoading(false);
  }, []);

  // Token refresh interval - every 30 minutes
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      const newToken = await refreshStoredToken();
      if (newToken) {
        setToken(newToken);
      } else {
        // Token refresh failed - clear auth state
        setToken(null);
        setUser(null);
        setProfile(null);
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  // Listen for storage changes (e.g., from login page in another tab)
  useEffect(() => {
    const syncFromStorage = () => {
      const storedToken = localStorage.getItem('senexpert_token');
      const storedUser = localStorage.getItem('senexpert_user');
      const storedProfile = localStorage.getItem('senexpert_profile');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
          }
        } catch {
          // ignore parse errors
        }
      } else {
        setToken(null);
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('auth-change', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('auth-change', syncFromStorage);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { user: loggedInUser, token: jwtToken, profile: userProfile } = data.data;

        localStorage.setItem('senexpert_token', jwtToken);
        localStorage.setItem('senexpert_user', JSON.stringify(loggedInUser));
        localStorage.setItem('senexpert_profile', JSON.stringify(userProfile));

        setToken(jwtToken);
        setUser(loggedInUser);
        setProfile(userProfile);

        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Logout API failure shouldn't block client-side logout
    } finally {
      localStorage.removeItem('senexpert_token');
      localStorage.removeItem('senexpert_user');
      localStorage.removeItem('senexpert_profile');
      setUser(null);
      setProfile(null);
      setToken(null);
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
      super_admin: [
        'manage_users', 'manage_roles', 'view_all_dashboards', 'manage_settings',
        'view_analytics', 'manage_employees', 'view_reports',
        'approve_financial_requests', 'view_financial_requests', 'make_financial_request',
      ],
      admin: [
        'manage_employees', 'view_all_dashboards', 'view_analytics',
        'view_reports', 'view_financial_requests', 'make_financial_request',
      ],
      accountant: ['approve_financial_requests', 'view_financial_requests'],
      hr: [],
      field: [],
      operator: ['view_inventory', 'add_inventory', 'view_own_inventory', 'make_tool_request'],
    };

    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, token, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('senexpert_token');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('senexpert_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getStoredProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('senexpert_profile');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export type { User, UserRole, Profile };

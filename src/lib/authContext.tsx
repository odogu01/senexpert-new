'use client';

/**
 * Auth Context - Client-side authentication state management
 * Uses API routes for server-side operations
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('senexpert_token');
        localStorage.removeItem('senexpert_user');
        localStorage.removeItem('senexpert_profile');
      }
    }
    setIsLoading(false);
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
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      await response.json();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('senexpert_token');
      localStorage.removeItem('senexpert_user');
      localStorage.removeItem('senexpert_profile');
      setUser(null);
      setProfile(null);
      setToken(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
      super_admin: [
        'manage_users',
        'manage_roles',
        'view_all_dashboards',
        'manage_settings',
        'view_analytics',
        'manage_employees',
        'view_reports',
      ],
      admin: [
        'manage_employees',
        'view_all_dashboards',
        'view_analytics',
        'view_reports',
      ],
      hr: [
        'manage_employees',
        'view_employee_data',
        'view_hr_dashboard',
      ],
      manager: [
        'view_team_dashboard',
        'view_reports',
      ],
      operator: [
        'add_inventory',
        'view_own_inventory',
        'make_tool_request',
      ],
    };

    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  };

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
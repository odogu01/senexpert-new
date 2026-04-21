import type { UserRole } from './database.types';

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  super_admin: '/dashboard',
  admin: '/dashboard',
  hr: '/dashboard',
  manager: '/dashboard',
  operator: '/dashboard',
};

export function getDashboardRoute(role: UserRole): string {
  return DASHBOARD_ROUTES[role] || '/dashboard';
}

export function isValidRole(role: string): role is UserRole {
  return ['super_admin', 'admin', 'hr', 'manager', 'operator'].includes(role);
}

export function getAllRoles(): UserRole[] {
  return ['super_admin', 'admin', 'hr', 'manager', 'operator'];
}
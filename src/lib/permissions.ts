import type { UserRole } from '@/lib/database.types';

/** Server-side RBAC policy. Client navigation may hide actions, but this is authoritative. */
export const roles = {
  toolEditors: ['super_admin', 'admin', 'operator', 'dev'],
  toolViewers: ['super_admin', 'admin', 'operator', 'dev'],
  requestCreators: ['super_admin', 'admin', 'field', 'operator', 'dev'],
  requestApprovers: ['super_admin', 'admin', 'dev'],
  financialCreators: ['super_admin', 'admin', 'operator', 'dev'],
  financialApprovers: ['super_admin', 'accountant', 'dev'],
  maintenanceManagers: ['super_admin', 'admin', 'operator', 'dev'],
  maintenanceSchedulers: ['super_admin', 'admin', 'operator'],
  auditReaders: ['super_admin', 'dev'],
  dashboardReaders: ['super_admin', 'admin', 'dev'],
  userManagers: ['super_admin', 'dev'],
} as const satisfies Record<string, readonly UserRole[]>;

export function hasRole(role: UserRole, allowed: readonly UserRole[]): boolean {
  return allowed.includes(role);
}

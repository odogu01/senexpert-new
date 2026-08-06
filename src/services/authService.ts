// @ts-nocheck
/**
 * Authentication Service — Server-only
 *
 * Uses the repository layer for all data access.
 * Business logic (validation, audit coordination) lives here.
 */
import type { ObjectId } from 'mongodb';
import type { Profile, User, UserRole } from '@/lib/database.types';
import {
  UserRepository,
  ProfileRepository,
  AuditLogRepository,
} from './repositories';

// Prevent client-import mistake
if (typeof window !== 'undefined') {
  console.warn('WARNING: authService should not be imported in client components. Use API routes instead.');
}

// ───────── Shared module-level instances ─────────
const userRepo = new UserRepository();
const profileRepo = new ProfileRepository();
const auditRepo = new AuditLogRepository();

// ───────── JWT helpers ─────────

async function getJwtModule() {
  return import('jsonwebtoken');
}

async function getBcryptModule() {
  return import('bcryptjs');
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = '7d';

async function generateToken(user: User): Promise<string> {
  const jwt = await getJwtModule();
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; role: UserRole } | null> {
  try {
    const jwt = await getJwtModule();
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: UserRole };
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

// ───────── Audit log helper ─────────

async function logAuditEvent(params: {
  userId?: string;
  user_name?: string;
  action: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'INSERT' | 'UPDATE' | 'DELETE';
  tableName?: string;
  recordId?: string;
  details?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    // Resolve user full name if not provided but userId is
    let userName = params.user_name;
    if (!userName && params.userId) {
      try {
        const u = await userRepo.findById(params.userId);
        userName = (u as any)?.full_name;
      } catch { /* best-effort */ }
    }

    await auditRepo.insertOne({
      user_id: params.userId,
      user_name: userName || null,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      new_values: {
        details: params.details,
        ...(params.newValues as Record<string, unknown>),
      },
      old_values: params.oldValues,
      ip_address: params.ipAddress,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ───────── Role configuration ─────────

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
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
  operator: [
    'view_inventory', 'add_inventory', 'view_own_inventory',
    'make_tool_request',
  ],
  // Invisible unrestricted role — union of all permissions.
  dev: [
    'manage_users', 'manage_roles', 'view_all_dashboards', 'manage_settings',
    'view_analytics', 'manage_employees', 'view_reports',
    'approve_financial_requests', 'view_financial_requests', 'make_financial_request',
    'view_inventory', 'add_inventory', 'view_own_inventory',
    'make_tool_request',
  ],
};

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  super_admin: '/dashboard',
  admin: '/dashboard',
  accountant: '/dashboard',
  hr: '/dashboard',
  field: '/dashboard',
  operator: '/dashboard',
  dev: '/dashboard',
};

// ───────── Exported type aliases ─────────

export interface AuthResponse {
  success: boolean;
  data?: { user: User; token: string; profile: Profile };
  error?: { message: string; status?: number };
}

export interface ProfileResponse {
  success: boolean;
  data?: Profile;
  error?: { message: string; status?: number };
}

export interface LoginCredentials { email: string; password: string }
export interface AuthError { message: string; status?: number }

// ───────── Token refresh ─────────

export async function refreshToken(token: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) return { success: false, error: 'Invalid or expired token' };

    const user = await userRepo.findById(decoded.userId);
    if (!user || !user.is_active) return { success: false, error: 'User not found or inactive' };

    const newToken = await generateToken({ ...user, _id: user.id });
    return { success: true, token: newToken };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, error: 'Failed to refresh token' };
  }
}

export async function isTokenExpiringSoon(token: string): Promise<boolean> {
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return true;
    return decoded.exp < Math.floor(Date.now() / 1000) + 86400;
  } catch {
    return true;
  }
}

// ───────── Login ─────────

const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function login(credentials: LoginCredentials, ipAddress?: string): Promise<AuthResponse> {
  try {
    const bcrypt = await getBcryptModule();

    const user = await userRepo.findByEmail(credentials.email);

    if (!user) {
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for email: ${credentials.email}. User not found.`,
        ipAddress,
      });
      return { success: false, error: { message: 'Invalid email or password. Please try again.', status: 401 } };
    }

    if (!user.is_active) {
      await logAuditEvent({
        userId: user.id, action: 'LOGIN_FAILED',
        details: `Failed login attempt for email: ${credentials.email}. Account is suspended.`,
        ipAddress,
      });
      return { success: false, error: { message: 'This account has been suspended. Please contact support.', status: 403 } };
    }

    // ── Account lockout check ──────────────────────────────────
    const failedAttempts = user.failed_login_attempts ?? 0;
    const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;

    if (lockedUntil && lockedUntil > new Date()) {
      const remainingMin = Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000);
      await logAuditEvent({
        userId: user.id, action: 'LOGIN_FAILED',
        details: `Failed login attempt for email: ${credentials.email}. Account locked (${remainingMin} min remaining).`,
        ipAddress,
      });
      return {
        success: false,
        error: {
          message: `Account locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`,
          status: 423,
        },
      };
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValidPassword) {
      const newCount = failedAttempts + 1;
      const updates: Record<string, unknown> = { failed_login_attempts: newCount };

      if (newCount >= LOCKOUT_THRESHOLD) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }

      await userRepo.updateOneRaw(user.id, updates);

      await logAuditEvent({
        userId: user.id, action: 'LOGIN_FAILED',
        details: `Failed login attempt ${newCount}/${LOCKOUT_THRESHOLD} for email: ${credentials.email}.`,
        ipAddress,
      });

      if (newCount >= LOCKOUT_THRESHOLD) {
        return {
          success: false,
          error: {
            message: 'Account locked due to too many failed attempts. Try again in 5 minutes.',
            status: 423,
          },
        };
      }

      const remaining = LOCKOUT_THRESHOLD - newCount;
      return {
        success: false,
        error: {
          message: `Invalid email or password. ${remaining} attempt(s) remaining.`,
          status: 401,
        },
      };
    }

    // ── Successful login — reset lockout fields ────────────────
    if (failedAttempts > 0 || lockedUntil) {
      await userRepo.updateOneRaw(user.id, {
        failed_login_attempts: 0,
        locked_until: null,
      });
    }

    const token = await generateToken({ ...user, _id: user.id });
    const profile = await profileRepo.findByUserId(user.id);

    await logAuditEvent({ userId: user.id, action: 'LOGIN', details: `User logged in: ${user.email}`, ipAddress });

    return {
      success: true,
      data: {
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, is_active: user.is_active, created_at: user.created_at, updated_at: user.updated_at },
        token,
        profile: profile ?? { id: user.id, email: user.email, full_name: user.full_name, role: user.role, is_active: user.is_active, created_at: user.created_at, updated_at: user.updated_at },
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: { message: 'An unexpected error occurred during login', status: 500 } };
  }
}

// ───────── Logout ─────────

export async function logout(actingUserId?: string, ipAddress?: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    await logAuditEvent({ userId: actingUserId, action: 'LOGOUT', details: 'User logged out', ipAddress });
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: { message: 'An unexpected error occurred during logout', status: 500 } };
  }
}

// ───────── Current user ─────────

export async function getCurrentUser(token?: string): Promise<{ user: User | null; token: string | null }> {
  try {
    if (!token) return { user: null, token: null };
    const decoded = await verifyToken(token);
    if (!decoded) return { user: null, token: null };

    const user = await userRepo.findById(decoded.userId);
    if (!user || !user.is_active) return { user: null, token: null };

    return { user: { ...user, id: user.id }, token };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, token: null };
  }
}

// ───────── Profile ─────────

export async function getProfile(userId: string): Promise<ProfileResponse> {
  try {
    const profile = await profileRepo.findByUserId(userId);
    if (!profile) return { success: false, error: { message: 'Profile not found', status: 404 } };
    return { success: true, data: profile };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: { message: 'Failed to fetch user profile', status: 500 } };
  }
}

export async function createProfile(userId: string, profileData: { full_name: string; role: UserRole }): Promise<ProfileResponse> {
  try {
    const profile = await profileRepo.upsertProfile(userId, { ...profileData, email: '' });
    return { success: true, data: profile };
  } catch (error) {
    console.error('Create profile error:', error);
    return { success: false, error: { message: 'Failed to create user profile', status: 500 } };
  }
}

export async function updateProfile(userId: string, updates: Record<string, unknown>): Promise<ProfileResponse> {
  try {
    // Whitelist editable fields — role is NEVER settable via self-update (prevents self-escalation).
    const allowed: Record<string, unknown> = {};
    if (typeof updates.full_name === 'string' && updates.full_name.trim()) allowed.full_name = updates.full_name.trim();
    if (typeof updates.avatar_url === 'string') allowed.avatar_url = updates.avatar_url;

    if (Object.keys(allowed).length === 0) {
      return { success: false, error: { message: 'No valid fields to update', status: 400 } };
    }

    const result = await profileRepo.upsertProfile(userId, allowed);
    if (!result) return { success: false, error: { message: 'Profile not found', status: 404 } };
    return { success: true, data: result };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: { message: 'Failed to update user profile', status: 500 } };
  }
}

// ───────── User management ─────────

export async function getUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    const users = await userRepo.getAll();
    // 'dev' users are invisible — never exposed through the users list.
    const visible = users.filter((u: any) => u.role !== 'dev');
    return { success: true, data: visible.map((u: any) => ({ ...u, id: u.id })) };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

export async function createUser(
  userData: { email: string; password: string; full_name: string; role: UserRole },
  actingUserId?: string,
  ipAddress?: string,
): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const bcrypt = await getBcryptModule();

    // The 'dev' role is created only via seed scripts — never through the API.
    if (userData.role === 'dev') return { success: false, error: 'Cannot create dev accounts through the API' };

    const exists = await userRepo.existsByEmail(userData.email);
    if (exists) return { success: false, error: 'User with this email already exists' };

    const password_hash = await bcrypt.hash(userData.password, 12);

    // Use the repository to insert — it auto-generates ObjectId + timestamps
    const created = await userRepo.insertOne({
      email: userData.email.toLowerCase(),
      password_hash,
      full_name: userData.full_name,
      role: userData.role,
      is_active: true,
    });

    // Create matching profile document
    await profileRepo.upsertProfile(created.id, {
      email: userData.email.toLowerCase(),
      full_name: userData.full_name,
      role: userData.role,
    });

    await logAuditEvent({
      userId: actingUserId,
      action: 'INSERT',
      tableName: 'users',
      recordId: created.id,
      newValues: { email: userData.email.toLowerCase(), full_name: userData.full_name, role: userData.role },
      ipAddress,
    });

    // Strip password_hash before returning
    const { password_hash: _, ...safeUser } = created as any;
    return { success: true, data: safeUser };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const bcrypt = await getBcryptModule();
    const user = await userRepo.findById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return { success: false, error: 'Current password is incorrect' };

    const newHash = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(userId, newHash);

    await logAuditEvent({
      userId,
      action: 'UPDATE',
      tableName: 'users',
      recordId: userId,
      details: 'Password changed by user',
      ipAddress,
    });

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Failed to change password' };
  }
}

export async function deleteUser(
  userId: string,
  actingUserId?: string,
  ipAddress?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await userRepo.findById(userId);
    if (!user) return { success: false, error: 'User not found' };
    if (user.email === 'superadmin@test.com') return { success: false, error: 'Cannot delete the super admin account' };
    if (user.role === 'dev') return { success: false, error: 'Cannot delete dev accounts' };

    await userRepo.deleteOne(userId);
    await profileRepo.deleteOne(userId);

    await logAuditEvent({
      userId: actingUserId,
      action: 'DELETE',
      tableName: 'users',
      recordId: userId,
      oldValues: { email: user.email, full_name: user.full_name, role: user.role },
      ipAddress,
    });

    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  actingUserId?: string,
  ipAddress?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const bcrypt = await getBcryptModule();
    const user = await userRepo.findById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const newHash = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(userId, newHash);

    await logAuditEvent({
      userId: actingUserId,
      action: 'UPDATE',
      tableName: 'users',
      recordId: userId,
      details: 'Password reset by admin',
      ipAddress,
    });

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

// ───────── RBAC utilities ─────────

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getDashboardRoute(role: UserRole): string {
  return DASHBOARD_ROUTES[role] || '/dashboard';
}

export function isValidRole(role: string): role is UserRole {
  return ['super_admin', 'admin', 'accountant', 'hr', 'field', 'operator', 'dev'].includes(role);
}

/**
 * Roles exposed to admins in the UI — 'dev' is intentionally invisible,
 * so it is NOT returned here even though isValidRole accepts it.
 */
export function getAllRoles(): UserRole[] {
  return ['super_admin', 'admin', 'accountant', 'hr', 'field', 'operator'];
}

export function onAuthStateChange(_callback: (event: any, user: User | null) => void) {
  return { data: { subscription: { unsubscribe: () => {} } } };
}

export async function isAuthenticated(token?: string): Promise<boolean> {
  if (!token) return false;
  const decoded = await verifyToken(token);
  return decoded !== null;
}

// @ts-nocheck
/**
 * Authentication Service for MongoDB
 * Uses dynamic imports to avoid bundling Node.js modules in the browser
 * WARNING: This file should ONLY be used in API routes or server components
 */

import type { ObjectId } from 'mongodb';
import type { Profile, User, UserRole } from '@/lib/database.types';

// Prevent usage in client components
if (typeof window !== 'undefined') {
  console.warn('WARNING: authService should not be imported in client components. Use API routes instead.');
}

async function getDb() {
  const { getCollection } = await import('@/lib/mongodb');
  return { getCollection };
}

async function getJwtModule() {
  return import('jsonwebtoken');
}

async function getBcryptModule() {
  return import('bcryptjs');
}

async function getMongodbModule() {
  return import('mongodb');
}

const JWT_SECRET = process.env.JWT_SECRET || 'senexpert-jwt-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

/**
 * Authentication Service for MongoDB
 */

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    profile: Profile;
  };
  error?: { message: string; status?: number };
}

export interface ProfileResponse {
  success: boolean;
  data?: Profile;
  error?: { message: string; status?: number };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

// ============================================
// JWT Helpers
// ============================================

async function generateToken(user: User): Promise<string> {
  const jwt = await getJwtModule();
  return jwt.sign(
    { 
      userId: user._id.toString(), 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// ============================================
// Audit Log Helper
// ============================================

async function logAuditEvent(params: {
  userId?: string;
  action: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'INSERT' | 'UPDATE' | 'DELETE';
  tableName?: string;
  recordId?: string;
  details?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  try {
    const { getCollection } = await getDb();
    const auditCollection = getCollection<unknown>('audit_logs');
    await auditCollection.insertOne({
      user_id: params.userId,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      new_values: {
        details: params.details,
        ...params.newValues,
      },
      old_values: params.oldValues,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ============================================
// Role Configuration
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    'manage_users',
    'manage_roles',
    'view_all_dashboards',
    'manage_settings',
    'view_analytics',
    'manage_employees',
    'view_reports',
    'approve_financial_requests',
  ],
  admin: [
    'manage_employees',
    'view_all_dashboards',
    'view_analytics',
    'view_reports',
  ],
  accountant: [
    'approve_financial_requests',
    'view_financial_requests',
  ],
  hr: [],
  field: [],
  operator: [
    'add_inventory',
    'view_own_inventory',
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
};

// ============================================
// Collections
// ============================================

async function getUsersCollection() {
  const { getCollection } = await getDb();
  return getCollection<User>('users');
}

async function getProfilesCollection() {
  const { getCollection } = await getDb();
  return getCollection<Profile>('profiles');
}

// ============================================
// Authentication Functions
// ============================================

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    
    const usersCollection = await getUsersCollection();
    const profilesCollection = await getProfilesCollection();
    const bcrypt = await getBcryptModule();
    const mongodb = await getMongodbModule();

    // Find user by email
    const user = await usersCollection.findOne({ email: credentials.email.toLowerCase() });

    if (!user) {
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for email: ${credentials.email}. User not found.`,
      });
      
      return {
        success: false,
        error: {
          message: 'Invalid email or password. Please try again.',
          status: 401,
        },
      };
    }

    // Check password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

    if (!isValidPassword) {
      await logAuditEvent({
        userId: user._id.toString(),
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for email: ${credentials.email}. Invalid password.`,
      });
      
      return {
        success: false,
        error: {
          message: 'Invalid email or password. Please try again.',
          status: 401,
        },
      };
    }

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        error: {
          message: 'This account has been suspended. Please contact support.',
          status: 403,
        },
      };
    }

    // Generate JWT token
    const token = await generateToken(user);

    // Get profile
    const profile = await profilesCollection.findOne({ _id: user._id });

    // Log successful login
    await logAuditEvent({
      userId: user._id.toString(),
      action: 'LOGIN',
      details: `User logged in: ${user.email}`,
    });

    return {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        token,
        profile: profile ? {
          id: profile._id.toString(),
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          is_active: profile.is_active,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          avatar_url: (profile as Record<string, unknown>).avatar_url as string | undefined,
        } : {
          id: user._id.toString(),
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred during login',
        status: 500,
      },
    };
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    await logAuditEvent({
      action: 'LOGOUT',
      details: 'User logged out',
    });
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred during logout',
        status: 500,
      },
    };
  }
}

/**
 * Get the current authenticated user from token
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  token: string | null;
}> {
  try {
    return { user: null, token: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, token: null };
  }
}

/**
 * Get user profile by user ID
 */
export async function getProfile(userId: string): Promise<ProfileResponse> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const profilesCollection = await getProfilesCollection();
    const mongodb = await getMongodbModule();

    let queryId: ObjectId;
    try {
      queryId = new mongodb.ObjectId(userId);
    } catch {
      return {
        success: false,
        error: {
          message: 'Invalid user ID',
          status: 400,
        },
      };
    }

    const profile = await profilesCollection.findOne({ _id: queryId });

    if (!profile) {
      return {
        success: false,
        error: {
          message: 'Profile not found',
          status: 404,
        },
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: {
        message: 'Failed to fetch user profile',
        status: 500,
      },
    };
  }
}

/**
 * Create a new user profile
 */
export async function createProfile(
  userId: string,
  profileData: { full_name: string; role: UserRole }
): Promise<ProfileResponse> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const profilesCollection = await getProfilesCollection();
    const mongodb = await getMongodbModule();

    let queryId: ObjectId;
    try {
      queryId = new mongodb.ObjectId(userId);
    } catch {
      return {
        success: false,
        error: {
          message: 'Invalid user ID',
          status: 400,
        },
      };
    }

    const profile: Profile = {
      _id: queryId,
      email: '',
      full_name: profileData.full_name,
      role: profileData.role,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await profilesCollection.insertOne(profile);

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error('Create profile error:', error);
    return {
      success: false,
      error: {
        message: 'Failed to create user profile',
        status: 500,
      },
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: { full_name?: string; role?: UserRole }
): Promise<ProfileResponse> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const profilesCollection = await getProfilesCollection();
    const mongodb = await getMongodbModule();

    let queryId: ObjectId;
    try {
      queryId = new mongodb.ObjectId(userId);
    } catch {
      return {
        success: false,
        error: {
          message: 'Invalid user ID',
          status: 400,
        },
      };
    }

    const updateFields: Partial<Profile> = {
      ...updates,
      updated_at: new Date(),
    };

    const result = await profilesCollection.findOneAndUpdate(
      { _id: queryId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return {
        success: false,
        error: {
          message: 'Profile not found',
          status: 404,
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: {
        message: 'Failed to update user profile',
        status: 500,
      },
    };
  }
}

/**
 * Get all users (for admin)
 */
export async function getUsers(): Promise<{
  success: boolean;
  data?: User[];
  error?: string;
}> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const usersCollection = await getUsersCollection();
    
    const users = await usersCollection.find({}).toArray();
    
    // Add id field for frontend compatibility
    const usersWithId = users.map(u => ({
      ...u,
      id: u._id?.toString() || '',
    }));
    
    return { success: true, data: usersWithId };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Create a new user (for admin)
 */
export async function createUser(userData: {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const usersCollection = await getUsersCollection();
    const profilesCollection = await getProfilesCollection();
    const bcrypt = await getBcryptModule();
    const mongodb = await getMongodbModule();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Hash password
    const password_hash = await bcrypt.hash(userData.password, 12);

    const user: User = {
      _id: new mongodb.ObjectId(),
      email: userData.email.toLowerCase(),
      password_hash,
      full_name: userData.full_name,
      role: userData.role,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await usersCollection.insertOne(user);

    // Create profile
    const profile: Profile = {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await profilesCollection.insertOne(profile);

    // Remove password_hash from returned user
    const { password_hash: _, ...userWithoutPassword } = user;

    return { success: true, data: userWithoutPassword };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const usersCollection = await getUsersCollection();
    const bcrypt = await getBcryptModule();
    const mongodb = await getMongodbModule();

    let queryId: ObjectId;
    try {
      queryId = new mongodb.ObjectId(userId);
    } catch {
      return { success: false, error: 'Invalid user ID' };
    }

    const user = await usersCollection.findOne({ _id: queryId });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await usersCollection.updateOne(
      { _id: queryId },
      { $set: { password_hash: newPasswordHash, updated_at: new Date() } }
    );

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Failed to change password' };
  }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const usersCollection = await getUsersCollection();
    const profilesCollection = await getProfilesCollection();
    const mongodb = await getMongodbModule();

    let queryId: ObjectId;
    try {
      queryId = new mongodb.ObjectId(userId);
    } catch {
      return { success: false, error: 'Invalid user ID' };
    }

    // Check if user exists
    const user = await usersCollection.findOne({ _id: queryId });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Prevent deleting yourself
    if (user.email === 'superadmin@test.com') {
      return { success: false, error: 'Cannot delete the super admin account' };
    }

    // Delete from both collections
    await usersCollection.deleteOne({ _id: queryId });
    await profilesCollection.deleteOne({ _id: queryId });

    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

/**
 * Reset user password (admin only - sets new password without knowing current)
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const usersCollection = await getUsersCollection();
    const bcrypt = await getBcryptModule();
    const mongodb = await getMongodbModule();

    let queryId: ObjectId;
    try {
      queryId = new mongodb.ObjectId(userId);
    } catch {
      return { success: false, error: 'Invalid user ID' };
    }

    const user = await usersCollection.findOne({ _id: queryId });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await usersCollection.updateOne(
      { _id: queryId },
      { $set: { password_hash: newPasswordHash, updated_at: new Date() } }
    );

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

// ============================================
// Role-Based Access Control
// ============================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get dashboard route for a role
 */
export function getDashboardRoute(role: UserRole): string {
  return DASHBOARD_ROUTES[role] || '/dashboard';
}

/**
 * Validate role value
 */
export function isValidRole(role: string): role is UserRole {
  return ['super_admin', 'admin', 'accountant', 'hr', 'field', 'operator'].includes(role);
}

/**
 * Get all roles
 */
export function getAllRoles(): UserRole[] {
  return ['super_admin', 'admin', 'accountant', 'hr', 'field', 'operator'];
}

/**
 * Listen for auth state changes (client-side simulation)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onAuthStateChange(callback: (event: any, user: User | null) => void) {
  return { data: { subscription: { unsubscribe: () => {} } } };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return false;
}
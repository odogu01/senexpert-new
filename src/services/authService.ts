import { supabase, type Profile, type UserRole } from '@/lib/supabase';
import type { User, Session, AuthError, LoginCredentials } from '@/lib/supabase';

/**
 * Authentication Service
 * 
 * Provides functions for:
 * - Login with email/password
 * - Logout
 * - Session management
 * - Profile fetching
 * - Role-based access control
 */

// ============================================
// Type Definitions
// ============================================

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    session: Session;
    profile: Profile;
  };
  error?: AuthError;
}

export interface ProfileResponse {
  success: boolean;
  data?: Profile;
  error?: AuthError;
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
    if (!supabase) return;
    
    await supabase.from('audit_logs').insert({
      user_id: params.userId,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      new_values: {
        details: params.details,
        ...params.newValues,
      },
      old_values: params.oldValues,
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
};

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  super_admin: '/dashboard',
  admin: '/dashboard',
  hr: '/dashboard',
  manager: '/dashboard',
};

// ============================================
// Authentication Functions
// ============================================

/**
 * Login with email and password
 * @param credentials - Email and password
 * @returns AuthResponse with user data, session, and profile
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // Check if Supabase client is configured
    if (!supabase) {
      return {
        success: false,
        error: {
          message: 'Supabase is not configured. Please update your .env.local file with valid Supabase credentials.',
          status: 500,
        },
      };
    }

    // Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      // Log failed login attempt
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for email: ${credentials.email}. Error: ${authError.message}`,
      });
      
      return {
        success: false,
        error: {
          message: getAuthErrorMessage(authError.code || 'unknown'),
          status: 401,
        },
      };
    }

    if (!authData.user || !authData.session) {
      return {
        success: false,
        error: {
          message: 'Invalid response from authentication server',
          status: 500,
        },
      };
    }

    // Fetch user profile
    const profileResponse = await getProfile(authData.user.id);
    
    if (!profileResponse.success || !profileResponse.data) {
      // If no profile exists, create one with default role
      const createProfileResult = await createProfile(authData.user.id, {
        full_name: authData.user.email?.split('@')[0] || 'User',
        role: 'manager', // Default role
      });

      if (!createProfileResult.success) {
        return {
          success: false,
          error: {
            message: 'Failed to create user profile',
            status: 500,
          },
        };
      }
    }

    // Get the profile (either existing or newly created)
    const finalProfileResponse = await getProfile(authData.user.id);
    
    // Log successful login
    await logAuditEvent({
      userId: authData.user.id,
      action: 'LOGIN',
      details: `User logged in: ${authData.user.email}`,
    });
    
    return {
      success: true,
      data: {
        user: authData.user as User,
        session: authData.session as Session,
        profile: finalProfileResponse.data as Profile,
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
    if (!supabase) {
      return { success: true };
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        success: false,
        error: {
          message: getAuthErrorMessage(error.code || 'unknown'),
          status: 500,
        },
      };
    }

    // Log logout (we can't get user ID after sign out, so we log system event)
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
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  session: Session | null;
}> {
  try {
    if (!supabase) {
      return { user: null, session: null };
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, session: null };
    }

    const { data: sessionData } = await supabase.auth.getSession();

    return {
      user: user as User,
      session: sessionData.session as Session | null,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, session: null };
  }
}

/**
 * Get user profile by user ID
 */
export async function getProfile(userId: string): Promise<ProfileResponse> {
  try {
    if (!supabase) {
      return {
        success: false,
        error: {
          message: 'Supabase is not configured',
          status: 500,
        },
      };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 404,
        },
      };
    }

    return {
      success: true,
      data: data as Profile,
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
    if (!supabase) {
      return {
        success: false,
        error: {
          message: 'Supabase is not configured',
          status: 500,
        },
      };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: profileData.full_name,
        role: profileData.role,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 500,
        },
      };
    }

    return {
      success: true,
      data: data as Profile,
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
    if (!supabase) {
      return {
        success: false,
        error: {
          message: 'Supabase is not configured',
          status: 500,
        },
      };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 500,
        },
      };
    }

    return {
      success: true,
      data: data as Profile,
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
  return ['super_admin', 'admin', 'hr', 'manager'].includes(role);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map Supabase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password. Please try again.',
    'user_not_found': 'No account found with this email address.',
    'invalid_password': 'Incorrect password. Please try again.',
    'email_not_confirmed': 'Please verify your email address first.',
    'too_many_requests': 'Too many login attempts. Please try again later.',
    'network_error': 'Network error. Please check your connection.',
    'invalid_email': 'Please enter a valid email address.',
    'user_banned': 'This account has been suspended.',
    'user_deleted': 'This account has been deleted.',
  };

  return errorMessages[code] || 'Authentication failed. Please try again.';
}

/**
 * Listen for auth state changes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onAuthStateChange(callback: (event: any, session: Session | null) => void) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    if (!supabase) {
      return false;
    }
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}

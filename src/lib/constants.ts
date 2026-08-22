/**
 * Shared application constants
 * Single source of truth for configuration values used across client and server
 */

// Operator visibility window - operators can only see tools they created within this window
export const OPERATOR_VISIBILITY_WINDOW_HOURS = 7;

// Auto-logout after inactivity (milliseconds)
export const AUTO_LOGOUT_INACTIVITY_MS = 45 * 60 * 1000; // 45 minutes

// Token refresh interval (milliseconds)
export const TOKEN_REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Token expiry warning threshold (milliseconds)
export const TOKEN_EXPIRY_WARNING_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting defaults
export const RATE_LIMIT_DEFAULT_MAX = 60;
export const RATE_LIMIT_DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_LOGIN_MAX = 10;
export const RATE_LIMIT_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Query cache defaults
export const QUERY_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const QUERY_GC_TIME_MS = 10 * 60 * 1000; // 10 minutes

// Password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const BCRYPT_ROUNDS = 12;

// JWT
export const JWT_EXPIRES_IN = '7d';
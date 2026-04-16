/**
 * Unified CORS origin configuration for Callable functions.
 * Set to true to allow all origins, which is safe for Callable functions
 * because they are protected by Firebase Auth and have built-in CSRF protection.
 */
export const CALLABLE_CORS_ORIGINS = true;

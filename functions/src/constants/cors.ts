/**
 * Unified CORS origin configuration for Callable functions.
 * Matches local development (localhost with any subdomain and port) 
 * and production domains.
 */
export const CALLABLE_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5000",
  "https://abi-planer-27.de",
  "https://dashboard.abi-planer-27.de",
  "https://tcg.abi-planer-27.de",
  "https://abi-planer-27.web.app",
  "https://abi-planer-27.firebaseapp.com",
  "https://abi-planer-75319.web.app",
  "https://abi-planer-75319.firebaseapp.com",
];

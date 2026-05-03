/**
 * client/src/lib/auth.ts
 * 
 * Standalone auth token helpers to avoid circular dependencies.
 * These functions are used by main.tsx and useAuth.ts without creating a cycle.
 */

const TOKEN_KEY = "paintpro_auth_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

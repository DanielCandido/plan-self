import type { User } from '@/types/auth.types';
import { bootstrapSession, clearClientSession } from './auth';
import { setAccessToken } from './api';

export interface SessionHydrationResult {
  user: User | null;
}

export async function hydrateSession(): Promise<SessionHydrationResult> {
  const user = await bootstrapSession();
  // Access token is kept in-memory after login; bootstrap re-validates the
  // session via the httpOnly refresh cookie on the /auth/me endpoint.
  return { user };
}

export function invalidateSession() {
  clearClientSession(false);
  setAccessToken(null);
}

export function syncAccessToken(token: string | null) {
  setAccessToken(token);
}

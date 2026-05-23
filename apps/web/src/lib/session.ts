import type { User } from '@/types/auth.types';
import { bootstrapSession, clearClientSession } from './auth';
import { setAccessToken } from './api';

export interface SessionHydrationResult {
  user: User | null;
  accessToken: string | null;
}

export async function hydrateSession(): Promise<SessionHydrationResult> {
  const user = await bootstrapSession();
  const accessToken = user ? null : null; // token comes back from /auth/me only for session validation
  return { user, accessToken };
}

export function invalidateSession() {
  clearClientSession(false);
  setAccessToken(null);
}

export function syncAccessToken(token: string | null) {
  setAccessToken(token);
}

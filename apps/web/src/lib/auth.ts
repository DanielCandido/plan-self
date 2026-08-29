import type { AuthResponse, LoginPayload, OAuthProvider, RefreshResponse, User } from '@/types/auth.types';
import apiClient, { setAccessToken } from './api';
import { storage } from './storage';

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  return data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // best-effort logout
  }
}

export async function refreshRequest(): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>('/auth/refresh');
  return data;
}

export async function getMeRequest(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export function redirectToOAuth(provider: OAuthProvider): void {
  window.location.href = `/api/auth/${provider}`;
}

export async function bootstrapSession(): Promise<User | null> {
  try {
    // First try to refresh the access token using the httpOnly cookie.
    const { accessToken } = await refreshRequest();
    setAccessToken(accessToken);

    // With the new access token set, request the authenticated user.
    const user = await getMeRequest();
    return user;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export function clearClientSession(clearStorage = false) {
  setAccessToken(null);
  if (clearStorage) {
    storage.clear();
  }
}

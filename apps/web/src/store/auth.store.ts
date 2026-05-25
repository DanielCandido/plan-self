'use client';

import { create } from 'zustand';
import type { AuthError, LoginPayload, User } from '@/types/auth.types';
import {
  bootstrapSession,
  clearClientSession,
  loginRequest,
  logoutRequest,
} from '@/lib/auth';
import { setAccessToken as applyAccessToken } from '@/lib/api';
import { storage } from '@/lib/storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapped: boolean;
  error: AuthError | null;

  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapped: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginRequest(payload);
      applyAccessToken(response.accessToken);

      if (payload.rememberMe) {
        storage.setRememberMe(true);
        storage.setRememberEmail(payload.email);
      } else {
        storage.setRememberMe(false);
        storage.setRememberEmail('');
      }

      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; statusCode?: number } } };
      set({
        isLoading: false,
        error: {
          message: axiosError.response?.data?.message ?? 'Credenciais inválidas. Tente novamente.',
          statusCode: axiosError.response?.data?.statusCode,
        },
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutRequest();
    } finally {
      clearClientSession(false);
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        isBootstrapped: true,
        error: null,
      });
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setAccessToken: (token: string | null) => {
    applyAccessToken(token);
    set({ accessToken: token });
  },

  clearSession: () => {
    clearClientSession(false);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  bootstrap: async () => {
    if (get().isBootstrapped) return;
    set({ isLoading: true });
    try {
      const user = await bootstrapSession();
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        isBootstrapped: true,
        error: null,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isBootstrapped: true,
      });
    }
  },
}));

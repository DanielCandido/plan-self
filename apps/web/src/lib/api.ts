import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { enqueueMutation } from './offline-queue';

declare module 'axios' {
  interface AxiosRequestConfig {
    _offlineReplay?: boolean;
    _offlineQueue?: boolean;
  }
  interface InternalAxiosRequestConfig {
    _offlineReplay?: boolean;
    _offlineQueue?: boolean;
  }
}

// Browser traffic always goes through the same reverse-proxy origin. On a LAN,
// "localhost" would point at the user's device, not at the Plan Self server.
const API_BASE_URL = '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ─── Token store (in-memory only) ────────────────────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Refresh queue ────────────────────────────────────────────────────────────

type QueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((entry) => {
    if (error) {
      entry.reject(error);
    } else {
      entry.resolve(token!);
    }
  });
  refreshQueue = [];
}

// ─── Request interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const method = config.method?.toLowerCase();
  if (method && ['post', 'put', 'patch', 'delete'].includes(method) && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = createMutationId();
  }
  return config;
});

function createMutationId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const method = originalRequest.method?.toLowerCase();
    const isMutation = method && ['post', 'put', 'patch', 'delete'].includes(method);
    const isAuthRequest = originalRequest.url?.startsWith('/auth/');
    const isNetworkFailure = !error.response;
    const isFilePayload = typeof FormData !== 'undefined' && originalRequest.data instanceof FormData;

    if (
      typeof window !== 'undefined' &&
      isMutation &&
      !isAuthRequest &&
      isNetworkFailure &&
      !isFilePayload &&
      originalRequest._offlineQueue !== false &&
      !originalRequest._offlineReplay
    ) {
      const idempotencyKey = String((originalRequest.headers as Record<string, unknown> | undefined)?.['Idempotency-Key'] ?? createMutationId());
      let payload = originalRequest.data;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { /* keep plain text payload */ }
      }
      await enqueueMutation({
        id: idempotencyKey,
        method: method as 'post' | 'put' | 'patch' | 'delete',
        url: originalRequest.url ?? '/',
        data: payload,
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      return {
        data: { queued: true, offlineMutationId: idempotencyKey },
        status: 202,
        statusText: 'Queued offline',
        headers: {},
        config: error.config!,
      };
    }

    const isUnauthorized = error.response?.status === 401;
    const isRefreshUrl = originalRequest.url?.includes('/auth/refresh');
    const alreadyRetried = originalRequest._retry === true;

    if (isUnauthorized && !isRefreshUrl && !alreadyRetried) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh');
        const newToken = data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);

        // Notify auth store to clear session and redirect
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:session-expired'));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;

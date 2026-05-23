export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthError {
  message: string;
  statusCode?: number;
  code?: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'SESSION_EXPIRED' | 'UNAUTHORIZED';
}

export interface SessionState {
  isBootstrapped: boolean;
  lastActivity?: number;
}

export type OAuthProvider = 'google' | 'github';

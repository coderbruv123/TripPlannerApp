import { api } from './client';
import type { StoredUser } from '../auth/storage';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResult<T = AuthResponse> {
  success: boolean;
  errorCode?: string;
  message?: string;
  data: T;
}

export interface AuthUser {
  id?: string;
  userId?: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  nickname?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  location?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  nickname?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  location?: string;
}

export interface UpdateProfileResult {
  success: boolean;
  errorCode?: string;
  message?: string;
  data?: AuthUser | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export function toStoredUser(data: AuthResponse | AuthUser): StoredUser {
  const profile = data as Partial<AuthUser>;
  return {
    userId: ('userId' in data ? data.userId : data.id) || '',
    username: data.username,
    email: data.email,
    role: data.role,
    nickname: profile.nickname ?? null,
    phone: profile.phone ?? null,
    address: profile.address ?? null,
    occupation: profile.occupation ?? null,
    location: profile.location ?? null,
  };
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const response = await api.post<AuthResult>('/auth/login', payload);
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const response = await api.post<AuthResult>('/auth/register', payload);
  return response.data;
}

export async function getMe(): Promise<AuthUser> {
  const response = await api.get<AuthUser>('/auth/me');
  return response.data;
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  if (!refreshToken) return;
  try {
    await api.post('/auth/revoke', { refreshToken });
  } catch {
    // Ignore revoke failures; local auth is still cleared.
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResult> {
  const response = await api.put<UpdateProfileResult>('/auth/update-profile', payload);
  return response.data;
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ success: boolean; errorCode?: string; message?: string }> {
  const response = await api.post('/auth/change-password', payload);
  return response.data;
}

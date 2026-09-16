import api from "./axiosInstance";
import type { AuthUser } from "./authUtils";
import { getRefreshToken } from "./authUtils";

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

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
}

export const login = async (
  data: LoginPayload
): Promise<AuthResult> => {
  const response = await api.post<AuthResult>("/auth/login", data);
  return response.data;
};

export const register = async (
  data: RegisterPayload
): Promise<AuthResult> => {
  const response = await api.post<AuthResult>("/auth/register", data);
  return response.data;
};

export const getMe = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>("/auth/me");
  return response.data;
};

export const refreshAccessToken = async (): Promise<AuthResponse> => {
  const refreshToken = getRefreshToken();
  const response = await api.post<AuthResult<AuthResponse>>(
    "/auth/refresh",
    { refreshToken }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Refresh failed");
  }

  return response.data.data;
};

export const revokeRefreshToken = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;

  try {
    await api.post("/auth/revoke", { refreshToken });
  } catch {
    // ignore - we clear locally regardless
  }
};

export const changePassword = async (
  data: ChangePasswordPayload
): Promise<{ success: boolean; errorCode?: string; message?: string }> => {
  const response = await api.post("/auth/change-password", data);
  return response.data;
};

export const updateProfile = async (
  data: UpdateProfilePayload
): Promise<{ success: boolean; errorCode?: string; message?: string }> => {
  const response = await api.put("/auth/update-profile", data);
  return response.data;
};

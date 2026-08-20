import api from "./axiosInstance";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminResult {
  success: boolean;
  errorCode?: string;
  message?: string;
  data?: UserDto;
}

export const getUsers = async (): Promise<UserDto[]> => {
  const response = await api.get<UserDto[]>("/admin/users");
  return response.data;
};

export const searchUsers = async (
  query: string
): Promise<UserDto[]> => {
  const response = await api.get<UserDto[]>("/admin/users/search", {
    params: { query },
  });
  return response.data;
};

export const updateUserRole = async (
  id: string,
  role: string
): Promise<AdminResult> => {
  const response = await api.put<AdminResult>(
    `/admin/users/${id}/role`,
    { role }
  );
  return response.data;
};

export const setUserStatus = async (
  id: string,
  isActive: boolean
): Promise<AdminResult> => {
  const response = await api.put<AdminResult>(
    `/admin/users/${id}/status`,
    { isActive }
  );
  return response.data;
};

export const deleteUser = async (id: string): Promise<AdminResult> => {
  const response = await api.delete<AdminResult>(`/admin/users/${id}`);
  return response.data;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get<AdminStats>("/admin/stats");
  return response.data;
};

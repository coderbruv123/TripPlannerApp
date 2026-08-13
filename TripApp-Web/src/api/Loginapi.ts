import api from "./axiosInstance";


interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  errorCode?: string;
  message?: string;
  success: boolean;
  data: {
  token: string;
  email?: string;
  username?: string;}
}

export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    data
  );

  localStorage.setItem("token", response.data.data.token);
 
  return response.data;
};


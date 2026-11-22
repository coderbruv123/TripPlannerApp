import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { clearAuth, getRefreshToken, getToken, persistTokens } from '../auth/storage';

type UnauthorizedHandler = () => void | Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    const data = response.data?.data;
    if (!data?.token) return null;
    await persistTokens(data.token, data.refreshToken ?? refreshToken);
    return data.token as string;
  } catch {
    return null;
  }
}

function tryRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const customConfig = config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!response || response.status !== 401 || !customConfig) {
      return Promise.reject(error);
    }

    const url = customConfig.url ?? '';
    const isAuthFlow =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    if (isAuthFlow || customConfig._retry || !(await getRefreshToken())) {
      await clearAuth();
      await unauthorizedHandler?.();
      return Promise.reject(error);
    }

    customConfig._retry = true;
    const newToken = await tryRefresh();

    if (!newToken) {
      await clearAuth();
      await unauthorizedHandler?.();
      return Promise.reject(error);
    }

    customConfig.headers.Authorization = `Bearer ${newToken}`;
    return api(customConfig);
  },
);

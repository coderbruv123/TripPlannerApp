
import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  clearAuth,
  getRefreshToken,
  getToken,
  persistTokens,
} from "./authUtils";

const api = axios.create({
  baseURL: "http://localhost:5176/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach access token
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Deduplicate concurrent refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await api.post("/auth/refresh", { refreshToken });

    const data = response.data?.data;
    if (!data?.token) {
      return null;
    }

    // Rotate tokens: store new access + refresh
    persistTokens(data.token, data.refreshToken ?? "");

    return data.token;
  } catch {
    return null;
  }
}

function tryRefresh(): Promise<string | null> {
  // Reuse in-flight refresh so parallel 401s don't each refresh
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// Handle expired/invalid tokens with silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const customConfig = config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // No response or not a 401 -> let it bubble
    if (!response || response.status !== 401) {
      return Promise.reject(error);
    }

    // Never try to refresh on the refresh/login endpoints themselves
    const url: string = config?.url ?? "";
    const isAuthFlow =
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register");

    const alreadyRetried = customConfig?._retry === true;

    if (isAuthFlow || alreadyRetried || !getRefreshToken()) {
      clearAuth();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    customConfig._retry = true;

    const newToken = await tryRefresh();

    if (!newToken) {
      clearAuth();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    customConfig.headers.Authorization = `Bearer ${newToken}`;
    return api(customConfig);
  }
);

export default api;

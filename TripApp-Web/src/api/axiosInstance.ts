
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5176/api",
  headers: {
    "Content-Type": "application/json",
  },
});

import { clearAuth, getToken } from "./authUtils";

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle expired/invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;

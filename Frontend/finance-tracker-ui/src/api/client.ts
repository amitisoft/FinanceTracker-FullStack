import axios from "axios";
import { authStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    const url: string = originalRequest.url ?? "";
    if (
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/forgot-password") ||
      url.includes("/api/auth/reset-password")
    ) {
      authStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if ((originalRequest as any)._retry) {
      authStore.getState().clearAuth();
      return Promise.reject(error);
    }
    (originalRequest as any)._retry = true;

    const refreshToken = authStore.getState().refreshToken;
    if (!refreshToken) {
      authStore.getState().clearAuth();
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/api/auth/refresh", { refreshToken })
          .then((res) => {
            const accessToken = res?.data?.accessToken;
            const nextRefresh = res?.data?.refreshToken ?? null;

            if (!accessToken) {
              throw new Error("Refresh succeeded but no accessToken returned.");
            }

            authStore.getState().setTokens(accessToken, nextRefresh);
            return accessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      authStore.getState().clearAuth();
      return Promise.reject(refreshError);
    }
  }
);

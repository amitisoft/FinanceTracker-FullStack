import { api } from "../../api/client";
import type {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationResponse,
  VerifyEmailResponse,
} from "../../types/auth";

export const login = async (payload: LoginRequest) => {
  const response = await api.post<AuthResponse>("/api/auth/login", payload);
  return response.data;
};

export const register = async (payload: RegisterRequest) => {
  const response = await api.post<RegisterResponse>("/api/auth/register", payload);
  return response.data;
};

export const refreshAuth = async (payload: RefreshRequest) => {
  const response = await api.post<AuthResponse>("/api/auth/refresh", payload);
  return response.data;
};

export const verifyEmail = async (token: string) => {
  const response = await api.get<VerifyEmailResponse>("/api/auth/verify-email", {
    params: { token },
  });
  return response.data;
};

export const resendVerification = async (email: string) => {
  const response = await api.post<ResendVerificationResponse>("/api/auth/resend-verification", { email });
  return response.data;
};

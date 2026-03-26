import { api } from "../../api/client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../../types/auth";

export const login = async (payload: LoginRequest) => {
  const response = await api.post<AuthResponse>("/api/auth/login", payload);
  return response.data;
};

export const register = async (payload: RegisterRequest) => {
  const response = await api.post("/api/auth/register", payload);
  return response.data;
};
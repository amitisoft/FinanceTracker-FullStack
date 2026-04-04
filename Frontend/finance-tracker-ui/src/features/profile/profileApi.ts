import { api } from "../../api/client";

export type UserProfile = {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  avatarColor?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
};

export type UpdateProfilePayload = {
  displayName?: string | null;
  avatarUrl?: string | null;
  avatarColor?: string | null;
};

export async function getProfile() {
  const res = await api.get<UserProfile>("/api/profile");
  return res.data;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const res = await api.put<UserProfile>("/api/profile", payload);
  return res.data;
}


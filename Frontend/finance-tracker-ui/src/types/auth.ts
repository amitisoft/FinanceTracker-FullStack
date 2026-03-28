export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RegisterResponse = {
  message: string;
  emailSent: boolean;
  verificationUrl?: string | null;
};

export type VerifyEmailResponse = {
  verified: boolean;
  message: string;
};

export type ResendVerificationResponse = {
  message: string;
  emailSent: boolean;
  verificationUrl?: string | null;
};

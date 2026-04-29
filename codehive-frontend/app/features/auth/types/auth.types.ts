import type { Role, User } from "~/shared/types/model/User";

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  name: string;
  fatherLastName: string;
  motherLastName: string;
  enrollmentNumber: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

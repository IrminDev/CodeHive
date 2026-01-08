import type { User } from "../model/User";

// Auth Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  lastName: string;
  enrollmentNumber: string;
  profilePictureUrl?: string;
}

// Auth Response Types
export interface AuthResponse {
  token: string;
  user: User;
}

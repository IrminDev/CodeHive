import type { Role } from "../model/User";
import type { User } from "../model/User";

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

export interface CsvBulkRegisterResponse {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}

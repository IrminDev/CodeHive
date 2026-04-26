import type { Role, User } from "~/shared/types";

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

export interface CsvTaskResponse {
  taskId: string;
}

export interface CsvProgressMessage {
  taskId: string;
  status: "PROCESSING" | "ROW_SUCCESS" | "ROW_ERROR" | "COMPLETED";
  currentRow: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  message: string | null;
  timestamp: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

import { API_BASE_URL } from "~/core/config/env";
import type {
  AuthResponse,
  CsvTaskResponse,
  LoginRequest,
  SignUpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "~/features/auth/types";
import type { MessageResponse, SuccessResponse, User } from "~/shared/types";

import { requestJson } from "./http";

const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;
const RECOVERY_BASE_URL = `${API_BASE_URL}/api/recovery-password`;

export function login(credentials: LoginRequest) {
  return requestJson<SuccessResponse<AuthResponse>>(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export function signUp(userData: SignUpRequest, token: string | null) {
  return requestJson<SuccessResponse<User>>(`${AUTH_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
}

export function uploadCsv(file: File, token: string | null) {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<SuccessResponse<CsvTaskResponse>>(
    `${AUTH_BASE_URL}/signup/csv`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );
}

export async function getMe(token: string | null) {
  return requestJson<SuccessResponse<User>>(`${AUTH_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function forgotPassword(request: ForgotPasswordRequest) {
  return requestJson<SuccessResponse<MessageResponse>>(
    `${RECOVERY_BASE_URL}/forgot`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
}

export function resetPassword(request: ResetPasswordRequest) {
  return requestJson<SuccessResponse<MessageResponse>>(
    `${RECOVERY_BASE_URL}/reset`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
}

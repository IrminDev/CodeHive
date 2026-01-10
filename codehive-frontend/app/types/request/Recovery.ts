export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

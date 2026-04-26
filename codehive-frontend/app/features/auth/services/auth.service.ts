import { API_BASE_URL } from "~/core/config/env";
import type { 
  LoginRequest, 
  SignUpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from "~/features/auth/types";

import * as authApi from "../api/auth.api";
import { getAuthToken } from "~/core/storage/token.storage";

export const AuthService = {
  login(credentials: LoginRequest) {
    return authApi.login(credentials);
  },

  signUp(userData: SignUpRequest) {
    return authApi.signUp(userData, getAuthToken());
  },

  uploadCsv(file: File) {
    return authApi.uploadCsv(file, getAuthToken());
  },

  getWebSocketUrl(): string {
    const base = API_BASE_URL.replace(/^http/, "ws");
    return `${base}/ws/csv-progress`;
  },

  getMe() {
    return authApi.getMe(getAuthToken());
  },

  forgotPassword(request: ForgotPasswordRequest) {
    return authApi.forgotPassword(request);
  },

  resetPassword(request: ResetPasswordRequest) {
    return authApi.resetPassword(request);
  },
} as const;

export default AuthService;

import type { ForgotPasswordRequest, ResetPasswordRequest } from "~/features/auth/types";
import type {
  MessageResponse,
  SuccessResponse,
  ErrorResponse,
} from "~/shared/types";

import { API_BASE_URL } from "~/core/config/env";

const RECOVERY_BASE_URL = `${API_BASE_URL}/api/recovery-password`;

export const RecoveryPasswordService = {
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<SuccessResponse<MessageResponse>> {
    const response = await fetch(`${RECOVERY_BASE_URL}/forgot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.message || "Failed to send password reset email");
    }

    return data as SuccessResponse<MessageResponse>;
  },

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<SuccessResponse<MessageResponse>> {
    const response = await fetch(`${RECOVERY_BASE_URL}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.message || "Failed to reset password");
    }

    return data as SuccessResponse<MessageResponse>;
  },
} as const;

export default RecoveryPasswordService;

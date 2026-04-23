import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
  SuccessResponse,
  ErrorResponse,
} from "~/shared/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class RecoveryPasswordServiceClass {
  private readonly baseUrl = `${API_BASE_URL}/api/recovery-password`;

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<SuccessResponse<MessageResponse>> {
    const response = await fetch(`${this.baseUrl}/forgot`, {
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
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<SuccessResponse<MessageResponse>> {
    const response = await fetch(`${this.baseUrl}/reset`, {
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
  }
}

export const RecoveryPasswordService = new RecoveryPasswordServiceClass();
export default RecoveryPasswordService;

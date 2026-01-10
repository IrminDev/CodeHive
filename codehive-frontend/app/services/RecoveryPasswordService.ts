import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
  SuccessResponse,
  ErrorResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class RecoveryPasswordServiceClass {
  private readonly baseUrl = `${API_BASE_URL}/api/recovery-password`;

  /**
   * Request a password reset email
   * @param request - Object containing the user's email or enrollment number
   * @returns Promise with success message
   * @throws Error if request fails
   */
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

  /**
   * Reset password using a valid token
   * @param request - Object containing token and new password
   * @returns Promise with success message
   * @throws Error if reset fails (invalid/expired token)
   */
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

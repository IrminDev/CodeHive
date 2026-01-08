// Base API Response Types
export interface SuccessResponse<T> {
  success: true;
  message: string | null;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  timestamp: string;
  error?: string;
  errors?: string[];
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Message Response
export interface MessageResponse {
  message: string;
}

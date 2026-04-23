import type { LoginRequest, SignUpRequest, AuthResponse, CsvTaskResponse } from "~/features/auth/types";
import type { SuccessResponse, ErrorResponse, User } from "~/shared/types";

import { API_BASE_URL } from "~/core/config/env";

const AUTH_TOKEN_KEY = "authToken";
const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;

function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function removeToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(AUTH_TOKEN_KEY);
}

export const AuthService = {
  async login(credentials: LoginRequest): Promise<SuccessResponse<AuthResponse>> {
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.message || "Login failed");
    }

    return data as SuccessResponse<AuthResponse>;
  },

  async signUp(userData: SignUpRequest): Promise<SuccessResponse<User>> {
    const response = await fetch(`${AUTH_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(
        errorData.error || errorData.message || "Registration failed"
      );
    }

    return data as SuccessResponse<User>;
  },

  async uploadCsv(file: File): Promise<SuccessResponse<CsvTaskResponse>> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${AUTH_BASE_URL}/signup/csv`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.error || errorData.message || "CSV upload failed");
    }

    return data as SuccessResponse<CsvTaskResponse>;
  },

  getWebSocketUrl(): string {
    const base = API_BASE_URL.replace(/^http/, "ws");
    return `${base}/ws/csv-progress`;
  },

  async getMe(): Promise<SuccessResponse<User>> {
    const token = getToken();
    const response = await fetch(`${AUTH_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("getMe failed:", response.status, text);
      throw new Error("Invalid token");
    }

    return (await response.json()) as SuccessResponse<User>;
  },

  setToken,
  getToken,
  removeToken,
  logout(): void {
    removeToken();
  },
} as const;

export default AuthService;

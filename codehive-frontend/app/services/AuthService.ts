import type {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  SuccessResponse,
  ErrorResponse,
  CsvBulkRegisterResponse,
} from "../types";
import type { User } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class AuthServiceClass {
  private readonly baseUrl = `${API_BASE_URL}/api/auth`;

  async login(credentials: LoginRequest): Promise<SuccessResponse<AuthResponse>> {
    const response = await fetch(`${this.baseUrl}/login`, {
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
  }

  async signUp(userData: SignUpRequest): Promise<SuccessResponse<User>> {
    const response = await fetch(`${this.baseUrl}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.error || errorData.message || "Registration failed");
    }
    return data as SuccessResponse<User>;
  }

  async uploadCsv(file: File): Promise<SuccessResponse<CsvBulkRegisterResponse>> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${this.baseUrl}/signup/csv`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.getToken()}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.error || errorData.message || "CSV upload failed");
    }
    return data as SuccessResponse<CsvBulkRegisterResponse>;
  }

  setToken(token: string): void { localStorage.setItem("authToken", token); }
  getToken(): string | null { return localStorage.getItem("authToken"); }
  removeToken(): void { localStorage.removeItem("authToken"); }
  isAuthenticated(): boolean { return this.getToken() !== null; }
  logout(): void { this.removeToken(); }
}

export const AuthService = new AuthServiceClass();
export default AuthService;

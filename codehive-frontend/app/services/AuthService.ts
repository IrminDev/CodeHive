import type {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  SuccessResponse,
  ErrorResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class AuthServiceClass {
  private readonly baseUrl = `${API_BASE_URL}/api/auth`;

  /**
   * Login user with email and password
   * @param credentials - Login credentials (email and password)
   * @returns Promise with auth response containing token and user data
   * @throws Error if login fails
   */
  async login(credentials: LoginRequest): Promise<SuccessResponse<AuthResponse>> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.message || "Login failed");
    }

    return data as SuccessResponse<AuthResponse>;
  }

  /**
   * Register a new user account
   * @param userData - User registration data
   * @returns Promise with auth response containing token and user data
   * @throws Error if registration fails
   */
  async signUp(userData: SignUpRequest): Promise<SuccessResponse<AuthResponse>> {
    const response = await fetch(`${this.baseUrl}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.message || "Registration failed");
    }

    return data as SuccessResponse<AuthResponse>;
  }

  /**
   * Store authentication token in localStorage
   * @param token - JWT token to store
   */
  setToken(token: string): void {
    localStorage.setItem("authToken", token);
  }

  /**
   * Get authentication token from localStorage
   * @returns The stored token or null if not found
   */
  getToken(): string | null {
    return localStorage.getItem("authToken");
  }

  /**
   * Remove authentication token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem("authToken");
  }

  /**
   * Check if user is authenticated
   * @returns true if token exists, false otherwise
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Logout user by removing token
   */
  logout(): void {
    this.removeToken();
  }
}

export const AuthService = new AuthServiceClass();
export default AuthService;

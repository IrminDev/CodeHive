const AUTH_TOKEN_KEY = "authToken";

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(AUTH_TOKEN_KEY);
}

const DEFAULT_API_BASE_URL = "http://localhost:8080";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_BASE_URL;

import { env } from "~/core/config/env";

const DEFAULT_API_URL = "http://localhost:8080";

function getApiBaseUrl() {
  return env.apiUrl || DEFAULT_API_URL;
}

export async function httpJson<TResponse>(
  path: string,
  init: RequestInit & { apiBaseUrl?: string } = {}
): Promise<TResponse> {
  const { apiBaseUrl, ...requestInit } = init;
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, requestInit);
  const data = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: unknown }).message)
        : "Request failed"
    );
  }
  return data as TResponse;
}

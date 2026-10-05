import type { ErrorResponse } from "~/shared/types/response/Api";

export async function requestJson<TResponse>(
  url: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as TResponse;
}

export async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as unknown;
      const error = data as Partial<ErrorResponse>;
      // Field-level validation messages say what to fix; prefer them over the generic summary.
      const details = (error.errors ?? []).filter((item) => typeof item === "string" && item.trim());
      if (details.length) return details.join(". ");
      return String(error.error || error.message || "Request failed");
    } catch {
      return "Request failed";
    }
  }

  try {
    const text = await response.text();
    return text || "Request failed";
  } catch {
    return "Request failed";
  }
}

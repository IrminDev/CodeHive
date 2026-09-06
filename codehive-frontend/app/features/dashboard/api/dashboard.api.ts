import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Your session is invalid or has expired. Please log in again.");
  }
  const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to update password");
  }
  return response.json();
};

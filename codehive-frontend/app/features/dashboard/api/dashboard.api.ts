import type { Group } from "../types/dashboard.types";
import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";

export const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "Fundamentos de programación",
    subject: "Primer semestre",
    colorClass: "bg-blue-600",
    pendingPractices: 2,
    inProgress: 1,
    nextDeadline: "May 2, 2026",
  },
  {
    id: "2",
    name: "Algoritmos y Estructuras de Datos",
    subject: "Segundo semestre",
    colorClass: "bg-teal-500",
    pendingPractices: 0,
    inProgress: 1,
    nextDeadline: "May 5, 2026",
  },
  {
    id: "3",
    name: "Análisis y Diseño de Algoritmos",
    subject: "Tercer semestre",
    colorClass: "bg-orange-500",
    pendingPractices: 1,
    inProgress: 0,
    nextDeadline: "April 30, 2026",
  },
  {
    id: "4",
    name: "Algoritmos y Estructuras de datos",
    subject: "Segundo Semestre",
    colorClass: "bg-yellow-500",
    pendingPractices: 0,
    inProgress: 2,
    nextDeadline: "May 8, 2026",
  },
];

export const getGroups = async (): Promise<Group[]> => {
  // Simulate network delay
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_GROUPS), 500));
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  const token = getAuthToken();
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

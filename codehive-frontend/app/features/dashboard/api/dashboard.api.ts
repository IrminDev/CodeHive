import type { Group } from "../types/dashboard.types";

export const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "Advanced Algorithms 2026",
    subject: "Computer Science",
    colorClass: "bg-blue-600",
    pendingPractices: 2,
    inProgress: 1,
    nextDeadline: "May 2, 2026",
  },
  {
    id: "2",
    name: "Web Development Fundamentals",
    subject: "Software Engineering",
    colorClass: "bg-teal-500",
    pendingPractices: 0,
    inProgress: 1,
    nextDeadline: "May 5, 2026",
  },
  {
    id: "3",
    name: "Data Structures Spring",
    subject: "Computer Science",
    colorClass: "bg-orange-500",
    pendingPractices: 1,
    inProgress: 0,
    nextDeadline: "April 30, 2026",
  },
  {
    id: "4",
    name: "Introduction to Python",
    subject: "Programming Basics",
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
  const token = localStorage.getItem("auth_token");
  const response = await fetch("/api/auth/me/password", {
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

export const updateProfilePicture = async (file: File) => {
  const token = localStorage.getItem("auth_token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/auth/me/profile-picture", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to upload picture");
  }
  return response.json();
};

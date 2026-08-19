import { studentRequest } from "./client";
import type { Assignment, AssignmentPage } from "../types/assignment.types";

export async function getAssignment(id: string): Promise<Assignment> {
  return studentRequest<Assignment>(`/api/assignments/${id}`);
}

export async function listAssignments(groupId: string, page = 0, size = 100): Promise<AssignmentPage> {
  const params = new URLSearchParams({ groupId, page: String(page), size: String(size) });
  return studentRequest<AssignmentPage>(`/api/assignments?${params}`);
}

export async function listAssignmentsForGroups(groupIds: string[]): Promise<Assignment[]> {
  const pages = await Promise.all(groupIds.map((groupId) => listAssignments(groupId)));
  return pages.flatMap((page) => page.content)
    .filter((assignment, index, items) => items.findIndex((item) => item.id === assignment.id) === index)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

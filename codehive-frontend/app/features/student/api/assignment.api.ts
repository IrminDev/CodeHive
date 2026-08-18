import { studentRequest } from "./client";
import type { Assignment, AssignmentPage } from "../types/assignment.types";

export async function getAssignment(id: string): Promise<Assignment> {
  return studentRequest<Assignment>(`/api/assignments/${id}`);
}

export async function listAssignments(page = 0, size = 12): Promise<AssignmentPage> {
  return studentRequest<AssignmentPage>(`/api/assignments?page=${page}&size=${size}`);
}

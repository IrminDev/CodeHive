import { jsonBody, studentRequest } from "./client";
import type { ClassGroup } from "../types/group.types";

export async function joinGroup(code: string): Promise<ClassGroup> {
  return studentRequest<ClassGroup>("/api/groups/join", {
    method: "POST",
    ...jsonBody({ joinCode: code }),
  });
}

export async function listMyGroups(): Promise<ClassGroup[]> {
  return studentRequest<ClassGroup[]>("/api/groups");
}

export async function getGroup(groupId: string): Promise<ClassGroup> {
  return studentRequest<ClassGroup>(`/api/groups/${groupId}`);
}

export async function leaveGroup(groupId: string): Promise<void> {
  await studentRequest<null>(`/api/groups/${groupId}/leave`, { method: "POST" });
}

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

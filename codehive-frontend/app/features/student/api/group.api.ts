import { studentRequest, jsonBody } from "./client";
import type { ClassGroup } from "../types/group.types";

export async function joinGroup(code: string): Promise<ClassGroup> {
  return studentRequest<ClassGroup>("/api/groups/join", {
    method: "POST",
    ...jsonBody({ code }),
  });
}

export async function listMyGroups(): Promise<ClassGroup[]> {
  return studentRequest<ClassGroup[]>("/api/groups/my-groups");
}

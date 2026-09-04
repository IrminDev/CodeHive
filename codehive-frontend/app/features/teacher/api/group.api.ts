import { jsonRequest, teacherRequest } from "./client";
import type {
  CreateGroupPayload,
  GroupEnrollment,
  TeacherGroup,
  UpdateGroupPayload,
} from "../types/group.types";

const groupPath = (groupId: string) => `/api/groups/${encodeURIComponent(groupId)}`;

export function createGroup(payload: CreateGroupPayload): Promise<TeacherGroup> {
  return teacherRequest<TeacherGroup>("/api/groups", { method: "POST", ...jsonRequest(payload) });
}

export function listTeacherGroups(includeDeleted = false): Promise<TeacherGroup[]> {
  return teacherRequest<TeacherGroup[]>(`/api/groups?includeDeleted=${includeDeleted}`);
}

export function getTeacherGroup(groupId: string): Promise<TeacherGroup> {
  return teacherRequest<TeacherGroup>(groupPath(groupId));
}

export function updateGroup(groupId: string, payload: UpdateGroupPayload): Promise<TeacherGroup> {
  return teacherRequest<TeacherGroup>(groupPath(groupId), { method: "PATCH", ...jsonRequest(payload) });
}

export function listGroupStudents(groupId: string): Promise<GroupEnrollment[]> {
  return teacherRequest<GroupEnrollment[]>(`${groupPath(groupId)}/students`);
}

export function removeGroupStudent(groupId: string, studentId: string): Promise<void> {
  return teacherRequest<void>(`${groupPath(groupId)}/students/${encodeURIComponent(studentId)}`, { method: "DELETE" });
}

export function archiveGroup(groupId: string): Promise<TeacherGroup> {
  return teacherRequest<TeacherGroup>(`${groupPath(groupId)}/archive`, { method: "POST" });
}

export function unarchiveGroup(groupId: string): Promise<TeacherGroup> {
  return teacherRequest<TeacherGroup>(`${groupPath(groupId)}/unarchive`, { method: "POST" });
}

export function deleteGroup(groupId: string): Promise<void> {
  return teacherRequest<void>(groupPath(groupId), { method: "DELETE" });
}

export function restoreGroup(groupId: string): Promise<TeacherGroup> {
  return teacherRequest<TeacherGroup>(`${groupPath(groupId)}/restore`, { method: "POST" });
}

export function rotateGroupJoinCode(groupId: string): Promise<TeacherGroup> {
  return teacherRequest<TeacherGroup>(`${groupPath(groupId)}/join-code/rotate`, { method: "POST" });
}

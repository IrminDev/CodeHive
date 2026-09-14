import { adminRequest, jsonPatch, queryString } from "./client";
import type {
  AdminAssignmentResource, AdminAuditAction, AdminAuditEvent, AdminAuditOutcome,
  AdminExecutionResource, AdminGroupResource, AdminStatistics, AdminSubmissionResource,
  AdminUserDetail, AdminUserStatus, AdminUserSummary, PageResponse, RateLimitIncident,
  UpdateScopesRequest, UpdateUserRequest, UpdateUserRoleRequest, UpdateUserStatusRequest,
  WebSocketTicketResponse,
} from "../types/admin.types";
import type { Role } from "~/shared/types/model/User";

export interface ListUsersParams {
  search?: string;
  role?: Role;
  status?: Exclude<AdminUserStatus, "DELETED">;
  page?: number;
  size?: number;
  sort?: "createdAt" | "name" | "lastName" | "email" | "enrollmentNumber" | "role" | "blocked";
  direction?: "ASC" | "DESC";
}

export const listAdminUsers = (params: ListUsersParams = {}, signal?: AbortSignal) =>
  adminRequest<PageResponse<AdminUserSummary>>(`/api/admin/users${queryString(params)}`, { signal });
export const getAdminUser = (id: string, signal?: AbortSignal) => adminRequest<AdminUserDetail>(`/api/admin/users/${id}`, { signal });
export const updateAdminUser = (id: string, request: UpdateUserRequest) => adminRequest<AdminUserDetail>(`/api/admin/users/${id}`, jsonPatch(request));
export const updateAdminUserRole = (id: string, request: UpdateUserRoleRequest) => adminRequest<AdminUserDetail>(`/api/admin/users/${id}/role`, jsonPatch(request));
export const updateAdminUserStatus = (id: string, request: UpdateUserStatusRequest) => adminRequest<AdminUserDetail>(`/api/admin/users/${id}/status`, jsonPatch(request));
export const updateAdminUserScopes = (id: string, request: UpdateScopesRequest) => adminRequest<AdminUserDetail>(`/api/admin/users/${id}/scopes`, jsonPatch(request));

export const listAdminUserGroups = (id: string, relationship: "OWNED" | "ENROLLED", page = 0, size = 20, signal?: AbortSignal) =>
  adminRequest<PageResponse<AdminGroupResource>>(`/api/admin/users/${id}/groups${queryString({ relationship, page, size })}`, { signal });
export const listAdminUserAssignments = (id: string, relationship: "AUTHORED" | "PARTICIPATED", page = 0, size = 20, signal?: AbortSignal) =>
  adminRequest<PageResponse<AdminAssignmentResource>>(`/api/admin/users/${id}/assignments${queryString({ relationship, page, size })}`, { signal });
export const listAdminUserSubmissions = (id: string, page = 0, size = 20, signal?: AbortSignal) =>
  adminRequest<PageResponse<AdminSubmissionResource>>(`/api/admin/users/${id}/submissions${queryString({ page, size })}`, { signal });
export const listAdminUserExecutions = (id: string, page = 0, size = 20, signal?: AbortSignal) =>
  adminRequest<PageResponse<AdminExecutionResource>>(`/api/admin/users/${id}/executions${queryString({ page, size })}`, { signal });

export const getAdminStatistics = (from?: string, to?: string, signal?: AbortSignal) =>
  adminRequest<AdminStatistics>(`/api/admin/statistics${queryString({ from, to })}`, { signal });

export interface IncidentParams { userId?: string; policy?: string; method?: string; endpoint?: string; from?: string; to?: string; page?: number; size?: number }
export const listRateLimitIncidents = (params: IncidentParams = {}, signal?: AbortSignal) =>
  adminRequest<PageResponse<RateLimitIncident>>(`/api/admin/rate-limit-incidents${queryString(params)}`, { signal });

export interface AuditParams { actorId?: string; targetId?: string; action?: AdminAuditAction; outcome?: AdminAuditOutcome; from?: string; to?: string; page?: number; size?: number }
export const listAdminAuditEvents = (params: AuditParams = {}, signal?: AbortSignal) =>
  adminRequest<PageResponse<AdminAuditEvent>>(`/api/admin/audit-events${queryString(params)}`, { signal });

export const requestWebSocketTicket = () => adminRequest<WebSocketTicketResponse>("/api/auth/websocket-ticket", { method: "POST" });

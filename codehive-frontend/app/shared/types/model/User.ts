export enum Role {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
}

export enum Scope {
  CREATE_GROUP = "CREATE_GROUP",
  CHECK_ANALYTICS = "CHECK_ANALYTICS",
  VIEW_USERS = "VIEW_USERS",
  CREATE_USERS = "CREATE_USERS",
  UPDATE_USERS = "UPDATE_USERS",
  MANAGE_USER_STATUS = "MANAGE_USER_STATUS",
  CREATE_ADMINS = "CREATE_ADMINS",
  UPDATE_ADMINS = "UPDATE_ADMINS",
  MANAGE_ADMIN_STATUS = "MANAGE_ADMIN_STATUS",
  MANAGE_SCOPES = "MANAGE_SCOPES",
  VIEW_AUDIT_LOG = "VIEW_AUDIT_LOG",
  SUPER_ADMIN = "SUPER_ADMIN",
  MANAGE_GROUPS = "MANAGE_GROUPS",
}

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  enrollmentNumber: string;
  role: Role;
  scopes?: Scope[];
  createdAt: string;
  isActive: boolean;
  temporaryPassword?: boolean;
}

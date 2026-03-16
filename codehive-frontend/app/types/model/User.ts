export enum Role {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
}

export enum Scope {
  CREATE_GROUP = "CREATE_GROUP",
  CHECK_ANALYTICS = "CHECK_ANALYTICS",
  MANAGE_USERS = "MANAGE_USERS",
  SUPER_ADMIN = "SUPER_ADMIN",
  MANAGE_GROUPS = "MANAGE_GROUPS",
}

export interface User {
  id: number;
  email: string;
  name: string;
  lastName: string;
  enrollmentNumber: string;
  profilePictureUrl?: string;
  role: Role;
  scopes?: Scope[];
  createdAt: string;
  isActive: boolean;
  temporaryPassword?: boolean;
}

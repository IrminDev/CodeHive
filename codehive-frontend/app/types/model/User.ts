export enum Role {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

export interface User {
  id: number;
  email: string;
  name: string;
  lastName: string;
  enrollmentNumber: string;
  profilePictureUrl?: string;
  role: Role;
  createdAt: string;
  isActive: boolean;
  temporaryPassword?: boolean;
}

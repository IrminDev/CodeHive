export type EnrollmentStatus = "ACTIVE" | "LEFT" | "REMOVED";

export interface TeacherGroup {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  joinCode?: string;
  archived: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentStudent {
  id: string;
  fullName: string;
  enrollmentNumber: string;
}

export interface GroupEnrollment {
  id: string;
  groupId: string;
  student: EnrollmentStudent;
  status: EnrollmentStatus;
  joinedAt: string;
  endedAt?: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateGroupPayload {
  name: string;
  description?: string;
}

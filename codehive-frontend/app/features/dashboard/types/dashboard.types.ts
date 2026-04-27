export interface Group {
  id: string;
  name: string;
  subject: string;
  colorClass: string;
  pendingPractices: number;
  inProgress: number;
  nextDeadline: string;
}

export interface ProfileUpdateRequest {
  currentPassword?: string;
  newPassword?: string;
  profilePicture?: File;
}

export type ClassGroup = {
  id: string;
  name: string;
  description?: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
  joinCode?: string;
  code?: string;
  schedule?: string;
  isActive: boolean;
  archived: boolean;
  memberCount?: number;
};

export interface Group {
  id: string;
  name: string;
  subject: string;
  colorClass: string;
  pendingPractices: number;
  inProgress: number;
  nextDeadline: string;
}

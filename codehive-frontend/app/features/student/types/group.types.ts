export type GroupStatus = 'ACTIVE' | 'INACTIVE' | 'READ_ONLY';

export type ClassGroup = {
  id: string;
  name: string;
  code: string;
  schedule?: string;
  status: GroupStatus;
  memberCount?: number;
};

export type { DashboardGroup as Group } from "~/shared/types/model/DashboardGroup";

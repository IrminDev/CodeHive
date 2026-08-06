export type GroupStatus = 'ACTIVE' | 'INACTIVE' | 'READ_ONLY';

export type ClassGroup = {
  id: string;
  name: string;
  code: string;
  schedule?: string;
  status: GroupStatus;
  memberCount?: number;
};

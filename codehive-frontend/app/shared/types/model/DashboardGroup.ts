export interface DashboardGroup {
  id: string;
  name: string;
  subject: string;
  colorClass: string;
  pendingPractices: number;
  inProgress: number;
  nextDeadline: string;
}

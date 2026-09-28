export interface GroupSubmission {
  assignmentId: string;
  submissionId: string;
  submittedAt: string;
  deliveredLate: boolean;
  executionStatus: "AC" | "WA" | "TLE" | "MLE" | "OLE" | "RTE" | "CE" | "PENDING";
}

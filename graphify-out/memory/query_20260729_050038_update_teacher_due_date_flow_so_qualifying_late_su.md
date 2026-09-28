---
type: "query"
date: "2026-07-29T05:00:38.009394+00:00"
question: "Update teacher due-date flow so qualifying late submissions become on time and past dates are rejected."
contributor: "graphify"
outcome: "useful"
source_nodes: ["AssignmentUpdateService", "SubmissionRepository", "Submission", "UpdateAssignmentRequest", "CreateAssignmentRequest", "CloneAssignmentRequest"]
---

# Q: Update teacher due-date flow so qualifying late submissions become on time and past dates are rejected.

## Answer

Expanded via graph vocab: [update, due, submission, delivered, late, dates, validation, future, current, assignment]. AssignmentUpdateService now reconciles deliveredLate true to false through SubmissionRepository when dueDate extends past submission creation time, and clears all late flags when dueDate is removed. Create, clone, and update requests use FutureOrPresent; service checks reject explicit past dates and async updates revalidate before apply. Frontend date inputs set next-minute minimum and submit checks reject past or misordered values. Shortening deadline does not turn existing on-time submissions late.

## Outcome

- Signal: useful

## Source Nodes

- AssignmentUpdateService
- SubmissionRepository
- Submission
- UpdateAssignmentRequest
- CreateAssignmentRequest
- CloneAssignmentRequest
---
type: "query"
date: "2026-07-29T04:51:24.936284+00:00"
question: "What happen when a teacher updates the delivery date after a submission of a student that was delivered late? Does the delivery of the student is updated as delivered on time? And does it exist any mechanism to validate for a teacher not to update the dates with a day previous to the current date?"
contributor: "graphify"
outcome: "useful"
source_nodes: [".requestExecution()", "Submission", "AssignmentUpdateService", ".validateProposedDates()", ".applyMetadata()"]
---

# Q: What happen when a teacher updates the delivery date after a submission of a student that was delivered late? Does the delivery of the student is updated as delivered on time? And does it exist any mechanism to validate for a teacher not to update the dates with a day previous to the current date?

## Answer

Expanded from original query via graph vocab: [submission, delivered, late, delivery, due, date, dates, update, assignment, teacher, validate, validation]. deliveredLate is calculated once from dueDate when definitive submission is created and is not recalculated by AssignmentUpdateService, so extending dueDate leaves an existing late submission marked late. Date update validation only enforces launchDate <= dueDate <= closeDate; UpdateAssignmentRequest has no future-date constraint and service performs no comparison against Instant.now(), so past dates are accepted when ordered consistently. Past closeDate immediately prevents new definitive deliveries.

## Outcome

- Signal: useful

## Source Nodes

- .requestExecution()
- Submission
- AssignmentUpdateService
- .validateProposedDates()
- .applyMetadata()
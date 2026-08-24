---
type: "query"
date: "2026-08-23T03:00:47.340162+00:00"
question: "Add a section for a teacher to also check the submission report from a student submission in TeacherGradesPage.tsx"
contributor: "graphify"
outcome: "useful"
source_nodes: ["TeacherGradesPage.tsx", "TeacherSubmissionEvidenceDTO", "ExecutionReport", "TeacherStudentReviewService"]
---

# Q: Add a section for a teacher to also check the submission report from a student submission in TeacherGradesPage.tsx

## Answer

Expanded from graph vocab: [teacher, grades, submission, report, execution, student, review, evidence, attempt, result]. TeacherGradesPage already fetched owner-authorized execution reports but exposed them as a minimal Tests tab. Added explicit Report tab, teacher API request, aggregate verdict/pass rate/resources, compiler and per-test diagnostics, actual/expected outputs, and pending/expired/error states. Added component tests.

## Outcome

- Signal: useful

## Source Nodes

- TeacherGradesPage.tsx
- TeacherSubmissionEvidenceDTO
- ExecutionReport
- TeacherStudentReviewService
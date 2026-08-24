---
type: "query"
date: "2026-08-23T00:26:58.347439+00:00"
question: "Implement approved plan for scoped students managing groups, assignments, grading, notifications, and admin role/scope lifecycle"
contributor: "graphify"
outcome: "useful"
source_nodes: ["User", "GroupService", "AdminUserService", "NotificationType", "NotificationPreferenceService", "ClassGroup", "GroupEnrollment"]
---

# Q: Implement approved plan for scoped students managing groups, assignments, grading, notifications, and admin role/scope lifecycle

## Answer

Expanded from original query via vocab: [group, enrollment, scope, role, assignment, notification, preference, admin, student, teacher, owner, deletion]. Implemented CREATE_GROUP manager capability for STUDENT and TEACHER, relationship-filtered group lists, terminal group deletion reasons, CANCELLED enrollments, confirmed admin cascades, OWNER/STUDENT notification audiences, manager frontend guards and admin confirmations. Verified backend and frontend gates.

## Outcome

- Signal: useful

## Source Nodes

- User
- GroupService
- AdminUserService
- NotificationType
- NotificationPreferenceService
- ClassGroup
- GroupEnrollment
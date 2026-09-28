---
type: "query"
date: "2026-07-29T04:12:41.963176+00:00"
question: "Does the list of students in a same group is only visible for the teacher or other students can see it?"
contributor: "graphify"
outcome: "useful"
source_nodes: [".students()", ".listStudents()", ".requireOwnedGroup()"]
---

# Q: Does the list of students in a same group is only visible for the teacher or other students can see it?

## Answer

Expanded from original query via graph vocab: [student, students, group, groups, professor, teacher, user, users, enrollment, visibility, visible, list]. Only group-owning teacher can retrieve student list. GroupController.students() calls GroupService.listStudents(); listStudents() calls requireOwnedGroup(), which checks authenticated user against group owner and throws AccessDeniedException when ownership fails. Ordinary enrolled students cannot access same-group member list through this endpoint.

## Outcome

- Signal: useful

## Source Nodes

- .students()
- .listStudents()
- .requireOwnedGroup()
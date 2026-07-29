---
type: "query"
date: "2026-07-29T04:19:22.505172+00:00"
question: "Modify this rule in order that other students within the same group can see the list of the other users in the group, they will be able to see only the list, they aren't supposed to see other things like their assignments, grades, etc, only the list of students enrolled in the same group"
contributor: "graphify"
outcome: "useful"
source_nodes: [".listStudents()", ".requireStudentListAccess()", ".students()"]
---

# Q: Modify this rule in order that other students within the same group can see the list of the other users in the group, they will be able to see only the list, they aren't supposed to see other things like their assignments, grades, etc, only the list of students enrolled in the same group

## Answer

Expanded from original request via graph vocab: [student, students, group, groups, enrollment, list, access, authorization, owner, assignment, grade, visibility]. Updated GroupService.listStudents() to authorize either group owner or actively enrolled student through isolated requireStudentListAccess(). Only ACTIVE enrollments are returned. Former and unrelated students remain denied. Assignment work, feedback, submission, and grade authorization were not changed.

## Outcome

- Signal: useful

## Source Nodes

- .listStudents()
- .requireStudentListAccess()
- .students()
import { route, type RouteConfig } from "@react-router/dev/routes";

export const teacherRoutes = [
  route("teacher", "features/teacher/routes/teacher.tsx"),
  route(
    "teacher/assignments",
    "features/teacher/routes/teacher.assignments.tsx",
  ),
  route(
    "teacher/create-assignment",
    "features/teacher/routes/teacher.create-assignment.tsx",
  ),
  route(
    "teacher/groups/create",
    "features/teacher/routes/teacher.create-group.tsx",
  ),
  route("teacher/groups", "features/teacher/routes/teacher.groups.tsx"),
  route(
    "teacher/groups/:groupId",
    "features/teacher/routes/teacher.groups.$groupId.tsx",
  ),
  route(
    "teacher/assignments/:assignmentId/clone",
    "features/teacher/routes/teacher.assignments.$assignmentId.clone.tsx",
  ),
  route(
    "teacher/assignments/:assignmentId/edit",
    "features/teacher/routes/teacher.assignments.$assignmentId.edit.tsx",
  ),
  route(
    "teacher/assignments/:assignmentId/revalidate",
    "features/teacher/routes/teacher.assignments.$assignmentId.revalidate.tsx",
  ),
  route(
    "teacher/assignments/:assignmentId/preview",
    "features/teacher/routes/teacher.assignments.$assignmentId.preview.tsx",
  ),
  route("teacher/grades", "features/teacher/routes/teacher.grades.tsx"),
  route("teacher/analytics", "features/teacher/routes/teacher.analytics.tsx"),
  route("teacher/notifications", "features/teacher/routes/teacher.notifications.tsx"),
] satisfies RouteConfig;

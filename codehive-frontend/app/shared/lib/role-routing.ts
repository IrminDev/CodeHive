import type { Role } from "~/shared/types/model/User";

export function getDashboardRoute(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "STUDENT":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
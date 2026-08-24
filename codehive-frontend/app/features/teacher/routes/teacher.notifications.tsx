import type { Route } from "./+types/teacher.notifications";
import { ManagerRoute } from "../components/ManagerRoute";
import { Navigate } from "react-router";

export function meta({}: Route.MetaArgs) { return [{ title: "Teacher Notifications - CodeHive" }]; }
export default function TeacherNotifications() { return <ManagerRoute><Navigate to="/notifications" replace /></ManagerRoute>; }

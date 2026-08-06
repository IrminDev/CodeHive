import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { JoinGroupPage } from "../pages/JoinGroupPage";
import { Role } from "~/shared/types/model/User";

export function meta() {
  return [
    { title: "Join a Class - CodeHive" },
    { name: "description", content: "Join a class group using your teacher's code." },
  ];
}

export default function StudentJoinGroup() {
  return (
    <ProtectedRoute roles={[Role.STUDENT]}>
      <JoinGroupPage />
    </ProtectedRoute>
  );
}

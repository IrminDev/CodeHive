import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { MyGroupsPage } from "../pages/MyGroupsPage";

export function meta() {
  return [
    { title: "My Groups - CodeHive" },
    { name: "description", content: "Your CodeHive class groups." },
  ];
}

export default function StudentGroups() {
  return <ProtectedRoute roles={[Role.STUDENT]}><MyGroupsPage /></ProtectedRoute>;
}

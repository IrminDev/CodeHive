import type { Route } from "./+types/admin.csv-upload";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { CsvUploadPage } from "../pages/CsvUploadPage";
import { Role, Scope } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bulk Registration - CodeHive Admin" },
    { name: "description", content: "Upload a CSV file to register multiple users at once." },
  ];
}

export default function AdminCsvUpload() {
  return (
    <ProtectedRoute roles={[Role.ADMIN]} scopes={[Scope.CREATE_USERS]}>
      <CsvUploadPage />
    </ProtectedRoute>
  );
}

import type { Route } from "./+types/admin.csv-upload";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { CsvUploadPage } from "../pages/CsvUploadPage";
import { Role } from "~/shared/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bulk Registration - CodeHive Admin" },
    { name: "description", content: "Upload a CSV file to register multiple users at once." },
  ];
}

export default function AdminCsvUpload() {
  return (
    <ProtectedRoute roles={[Role.ADMIN]}>
      <CsvUploadPage />
    </ProtectedRoute>
  );
}

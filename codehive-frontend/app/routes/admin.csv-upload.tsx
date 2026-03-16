import type { Route } from "./+types/admin.csv-upload";
import { ThemeProvider } from "../context/ThemeContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { CsvUploadPage } from "../pages/admin/CsvUploadPage";
import { Role } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bulk Registration - CodeHive Admin" },
    { name: "description", content: "Upload a CSV file to register multiple users at once." },
  ];
}

export default function AdminCsvUpload() {
  return (
    <ThemeProvider>
      <ProtectedRoute roles={[Role.ADMIN]}>
        <CsvUploadPage />
      </ProtectedRoute>
    </ThemeProvider>
  );
}

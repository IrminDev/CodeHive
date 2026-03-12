import type { Route } from "./+types/admin.csv-upload";
import { ThemeProvider } from "../context/ThemeContext";
import { CsvUploadPage } from "../pages/admin/CsvUploadPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bulk Registration - CodeHive Admin" },
    { name: "description", content: "Upload a CSV file to register multiple users at once." },
  ];
}

export default function AdminCsvUpload() {
  return (
    <ThemeProvider>
      <CsvUploadPage />
    </ThemeProvider>
  );
}

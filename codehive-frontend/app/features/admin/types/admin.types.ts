export interface CsvTaskResponse {
  taskId: string;
}

export interface CsvProgressMessage {
  taskId: string;
  status: "PROCESSING" | "ROW_SUCCESS" | "ROW_ERROR" | "COMPLETED";
  currentRow: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  message: string | null;
}

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "~/core/providers/ThemeProvider";
import { AuthService } from "~/features/auth/services/auth.service";
import type { CsvProgressMessage } from "~/features/admin/types/admin.types";

export function CsvUploadPage() {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<CsvProgressMessage | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanupWebSocket;
  }, [cleanupWebSocket]);

  function handleFileSelect(selected: File | undefined) {
    if (selected && selected.type === "text/csv") {
      setFile(selected);
      setErrorMessage("");
    } else if (selected) {
      setFile(null);
      setErrorMessage("Please select a valid CSV file.");
    }
  }

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setProgress(null);
    setErrors([]);
    setErrorMessage("");

    try {
      const response = await AuthService.uploadCsv(file);
      const { taskId } = response.data;

      const wsUrl = AuthService.getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => ws.send(taskId);

      ws.onmessage = (event) => {
        const msg: CsvProgressMessage = JSON.parse(event.data);
        setProgress(msg);
        if (msg.status === "ROW_ERROR" && msg.message) {
          setErrors((prev) => [...prev, msg.message!]);
        }
        if (msg.status === "COMPLETED") {
          setIsLoading(false);
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          cleanupWebSocket();
        }
      };

      ws.onerror = () => {
        setErrorMessage("A connection error occurred while tracking progress.");
        setIsLoading(false);
        cleanupWebSocket();
      };
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setIsLoading(false);
    }
  };

  const progressPercent =
    progress && progress.totalRows > 0
      ? Math.round((progress.currentRow / progress.totalRows) * 100)
      : 0;
  const isCompleted = progress?.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-azure/5 dark:bg-azure/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow/5 dark:bg-yellow/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700
                         text-gray-500 dark:text-gray-400
                         hover:border-azure/50 dark:hover:border-yellow/50
                         hover:text-azure dark:hover:text-yellow transition-all duration-200"
              aria-label="Back to Admin Dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">Bulk Registration</span>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20">
                <span className="text-xs font-medium text-azure dark:text-yellow">Admin</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Page header */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-4">
            <span className="text-sm font-medium text-azure dark:text-yellow">Bulk Upload</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Register users <span className="gradient-text">from CSV</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a CSV file to register up to 1500 users in one operation.
          </p>
        </div>

        {/* Format info card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-azure to-french text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Expected CSV Format</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No header row. Each row must have exactly 6 columns in this order:
            </p>
            <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700/50">
              <p className="text-gray-400 dark:text-gray-500 mb-2"># role, name, fatherLastName, motherLastName, enrollmentNumber, email</p>
              <p className="text-gray-700 dark:text-gray-300">STUDENT,Juan,García,López,2021630001,juan@example.com</p>
              <p className="text-gray-700 dark:text-gray-300">TEACHER,María,Hernández,Pérez,2021630002,maria@example.com</p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Valid roles: <span className="text-azure dark:text-yellow font-medium">STUDENT</span>,{" "}
              <span className="text-azure dark:text-yellow font-medium">TEACHER</span>,{" "}
              <span className="text-azure dark:text-yellow font-medium">ADMIN</span>. Maximum 1500 records per upload.
            </p>
          </div>
        </div>

        {/* Upload card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-french to-imperial text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Upload CSV File</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-azure dark:border-yellow bg-azure/5 dark:bg-yellow/5"
                  : file
                  ? "border-azure/50 dark:border-yellow/50 bg-azure/5 dark:bg-yellow/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-azure/50 dark:hover:border-yellow/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files[0]);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-azure/10 dark:bg-yellow/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-azure dark:text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB · CSV
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-dark-surface flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                    Drop your CSV here, or{" "}
                    <span className="text-azure dark:text-yellow cursor-pointer hover:underline">browse</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Only .csv files are accepted</p>
                </>
              )}
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="w-full btn-primary py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading…
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload & Register Users
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Progress card */}
        {progress && (
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-azure/10 dark:bg-yellow/10 flex items-center justify-center">
                    <svg className="animate-spin w-4 h-4 text-azure dark:text-yellow" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {isCompleted ? "Upload Complete" : "Processing…"}
                </h2>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {progress.currentRow} / {progress.totalRows} rows
              </span>
            </div>

            <div className="p-6 space-y-5">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>{progressPercent}% complete</span>
                  <span>{progress.currentRow} processed</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-azure to-french dark:from-yellow dark:to-gold"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Count grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700/30">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.currentRow}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Processed</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-100 dark:border-green-800/30">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{progress.successCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Succeeded</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-100 dark:border-red-800/30">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{progress.errorCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Failed</p>
                </div>
              </div>

              {/* Current row message */}
              {!isCompleted && progress.message && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {progress.message}
                </p>
              )}

              {/* Row errors */}
              {errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        {errors.length} {errors.length === 1 ? "error" : "errors"}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {errors.map((err, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800/30"
                      >
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

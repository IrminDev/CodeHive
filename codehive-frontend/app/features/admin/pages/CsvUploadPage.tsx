import { useState, useRef, useCallback, useEffect } from "react";
import { AuthService } from "~/features/auth/services/auth.service";
import type { CsvProgressMessage } from "~/features/admin/types/admin.types";
import { AdminLayout } from "../components/AdminLayout";

const TIPS = [
  { text: "UTF-8 encoded", sub: "Accents & tildes (á, é, ñ) are preserved when saved as UTF-8" },
  { text: "Unique enrollment numbers", sub: "Duplicates are rejected; each row must have a distinct number" },
  { text: "Email must be valid", sub: "Temporary passwords are mailed immediately upon creation" },
  { text: "Test with a small file first", sub: "Try 5–10 rows to validate column order before a full batch" },
];

const RECENT_UPLOADS = [
  { name: "cs410-graphs-roster.csv", rows: "1.1k rows", time: "2 min ago", status: "ok" },
  { name: "cs410-systems-roster.csv", rows: "980 rows", time: "1h ago", status: "partial" },
];

export function CsvUploadPage() {
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
    <AdminLayout breadcrumb="Bulk registration">
      <div className="px-6 lg:px-8 py-6 space-y-5">

        {/* ── Page header ── */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow/10 border border-yellow/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
            <span className="text-yellow text-[10px] font-bold tracking-widest uppercase">Bulk Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Register up to{" "}
            <span className="text-yellow">1,500 users</span>{" "}
            from CSV
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/35 mt-1">
            Each row provisions one account and emails a temporary password.
            Progress streams live over WebSocket.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-5 items-start">

          {/* Left — upload + progress */}
          <div className="space-y-4">

            {/* Upload card */}
            <div className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#4d9fff]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#4d9fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Upload file</span>
              </div>

              <div className="p-5 space-y-4">
                {/* Drop zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? "border-[#4d9fff] bg-[#4d9fff]/5"
                      : file
                      ? "border-[#4d9fff]/40 bg-[#4d9fff]/3"
                      : "border-gray-200 dark:border-white/10 hover:border-[#4d9fff]/40 dark:hover:border-[#4d9fff]/30"
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
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />

                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-white/60 font-medium">
                      Drop your CSV
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/25 mt-0.5">
                      or click here to browse your device
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-white/40 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Choose file
                    </button>
                  </div>
                </div>

                {/* Selected file row */}
                {file && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/3 border border-gray-200 dark:border-white/8">
                    <svg className="w-4 h-4 text-[#4d9fff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-white/60 font-medium flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 dark:text-white/25 flex-shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs text-gray-400 dark:text-white/25 hover:text-red-500 transition-colors ml-1"
                    >
                      remove
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1557e0] hover:bg-[#1248c4] text-white text-xs font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {isLoading ? (
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <>
                          Upload
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Error */}
                {errorMessage && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress card */}
            {progress && (
              <div className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-green-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-yellow">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-pulse" />
                        In progress
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-white/30 font-mono">
                      {progress.currentRow}/{progress.totalRows} · {progressPercent}%
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isCompleted ? "bg-green-500" : "bg-[#1557e0]"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/5 p-3 text-center">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{progress.currentRow}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/25 mt-0.5 uppercase tracking-wide">Processed</p>
                    </div>
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/30 p-3 text-center">
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{progress.successCount}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/25 mt-0.5 uppercase tracking-wide">Created</p>
                    </div>
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/30 p-3 text-center">
                      <p className="text-xl font-bold text-red-500 dark:text-red-400">{progress.errorCount}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/25 mt-0.5 uppercase tracking-wide">Failed</p>
                    </div>
                  </div>

                  {/* Live message */}
                  {!isCompleted && progress.message && (
                    <p className="text-xs text-gray-400 dark:text-white/25 font-mono truncate">
                      {progress.message}
                    </p>
                  )}

                  {/* Row errors */}
                  {errors.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-red-500 mb-2">
                        {errors.length} {errors.length === 1 ? "error" : "errors"}
                      </p>
                      <ul className="space-y-1 max-h-36 overflow-y-auto">
                        {errors.map((err, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800/20">
                            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>

          {/* Right — info panel */}
          <div className="space-y-4">

            {/* Expected CSV format */}
            <div className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Expected CSV format</span>
                <button className="text-xs text-[#4d9fff] hover:text-[#4d9fff]/70 transition-colors font-medium">
                  copy sample
                </button>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-gray-500 dark:text-white/35 leading-relaxed">
                  No header row. Each row must contain exactly{" "}
                  <span className="font-semibold text-gray-700 dark:text-white/60">6 columns</span>{" "}
                  in this order:
                </p>

                {/* Column labels */}
                <div className="flex gap-1.5 flex-wrap">
                  {["1.role", "2.name", "3.father", "4.mother", "5.enroll", "6.email"].map((col) => (
                    <span key={col} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-[10px] font-mono text-gray-500 dark:text-white/35 border border-gray-200 dark:border-white/8">
                      {col}
                    </span>
                  ))}
                </div>

                {/* Code example */}
                <div className="bg-gray-50 dark:bg-[#060d1e] rounded-lg p-3 font-mono text-[10px] leading-relaxed border border-gray-200 dark:border-white/5 overflow-x-auto">
                  <p className="text-gray-400 dark:text-white/20 mb-1"># role,name,fatherLastName,motherLastName,enrollment,email</p>
                  <p className="text-gray-700 dark:text-white/50">STUDENT,Juan,García,López,2021630001,juan@ipn.mx</p>
                  <p className="text-gray-700 dark:text-white/50">TEACHER,María,Hernández,Pérez,2021630002,maria@ipn.mx</p>
                  <p className="text-gray-700 dark:text-white/50">ADMIN,Tomás,Vega,Reyes,2021630099,tomás@ipn.mx</p>
                </div>

                {/* Role badges */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 dark:text-white/25">Valid roles:</span>
                  {["STUDENT", "TEACHER", "ADMIN"].map((r) => (
                    <span key={r} className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${
                      r === "STUDENT" ? "bg-[#4d9fff]/10 text-[#4d9fff] border-[#4d9fff]/20"
                      : r === "TEACHER" ? "bg-yellow/10 text-yellow border-yellow/20"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Tips for smooth uploads</span>
              </div>
              <ul className="divide-y divide-gray-50 dark:divide-white/3">
                {TIPS.map((tip) => (
                  <li key={tip.text} className="flex items-start gap-3 px-5 py-3">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-white/60">{tip.text}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/25 mt-0.5 leading-relaxed">{tip.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent uploads */}
            {RECENT_UPLOADS.length > 0 && (
              <div className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Recent uploads</span>
                </div>
                <ul className="divide-y divide-gray-50 dark:divide-white/3">
                  {RECENT_UPLOADS.map((upload) => (
                    <li key={upload.name} className="flex items-center gap-3 px-5 py-3">
                      <svg className="w-4 h-4 text-gray-400 dark:text-white/25 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-white/60 truncate">{upload.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white/25">{upload.rows} · {upload.time}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        upload.status === "ok"
                          ? "bg-green-50 dark:bg-green-900/15 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30"
                          : "bg-yellow/10 text-yellow border-yellow/20"
                      }`}>
                        {upload.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

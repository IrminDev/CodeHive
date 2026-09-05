import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { AuthService } from "~/features/auth/services/auth.service";
import { requestWebSocketTicket } from "../api/admin.api";
import { AdminShell } from "../components/AdminShell";
import { AdminPageHeader, panelClass, primaryCompactClass } from "../components/AdminUI";
import type { CsvProgressMessage } from "../types/admin.types";

export function CsvUploadPage() {
  const inputRef = useRef<HTMLInputElement>(null); const socketRef = useRef<WebSocket | null>(null); const terminalRef = useRef(false);
  const [file, setFile] = useState<File | null>(null); const [dragging, setDragging] = useState(false); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState<CsvProgressMessage | null>(null); const [rowErrors, setRowErrors] = useState<string[]>([]); const [error, setError] = useState<string>();
  const cleanup = useCallback(() => { const socket = socketRef.current; socketRef.current = null; if (socket && socket.readyState < WebSocket.CLOSING) socket.close(); }, []);
  useEffect(() => cleanup, [cleanup]);
  function choose(selected?: File) { if (!selected) return; if (!selected.name.toLowerCase().endsWith(".csv")) { setFile(null); setError("Select a file with .csv extension."); return; } setFile(selected); setError(undefined); setProgress(null); setRowErrors([]); }
  async function upload() {
    if (!file) return; cleanup(); terminalRef.current = false; setBusy(true); setProgress(null); setRowErrors([]); setError(undefined);
    try {
      const response = await AuthService.uploadCsv(file); const ticket = await requestWebSocketTicket();
      const socket = new WebSocket(AuthService.getWebSocketUrl(ticket.ticket)); socketRef.current = socket;
      socket.onopen = () => socket.send(response.data.taskId);
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as CsvProgressMessage;
          if (message.taskId !== response.data.taskId) return;
          setProgress(message);
          if (message.status === "ROW_ERROR" && message.message) setRowErrors((current) => [...current, message.message!]);
          if (message.status === "COMPLETED") { terminalRef.current = true; setBusy(false); setFile(null); if (inputRef.current) inputRef.current.value = ""; cleanup(); }
        } catch { terminalRef.current = true; setError("Progress server returned an invalid message."); setBusy(false); cleanup(); }
      };
      socket.onerror = () => { if (!terminalRef.current) { setError("Could not track CSV progress. Ticket may have expired."); setBusy(false); } };
      socket.onclose = () => { if (!terminalRef.current && socketRef.current === socket) { socketRef.current = null; setError("Progress connection closed before processing finished."); setBusy(false); } };
    } catch (cause) { setError(cause instanceof Error ? cause.message : "CSV upload failed."); setBusy(false); cleanup(); }
  }
  const percent = progress?.totalRows ? Math.round(progress.currentRow / progress.totalRows * 100) : 0;
  return <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users", to: "/admin/users" }, { label: "CSV upload" }]} contentClassName="max-w-4xl">
    <AdminPageHeader eyebrow="Bulk registration" title="Upload users from CSV" description="Register up to 1,500 students and teachers while tracking row-level progress." />
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <section className={`${panelClass} p-5`}><h2 className="text-sm font-semibold">Expected format</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No header. Exactly six columns:</p><div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-card p-4 overflow-x-auto font-mono text-xs whitespace-nowrap"><p className="text-gray-400">role,name,fatherLastName,motherLastName,enrollmentNumber,email</p><p className="mt-2">STUDENT,Juan,García,López,2026630001,juan@example.com</p><p>TEACHER,María,Hernández,Pérez,TEA-001,maria@example.com</p></div><p className="mt-3 text-xs text-gray-500">Allowed roles: STUDENT, TEACHER. ADMIN rows are rejected.</p></section>
      <section className={`${panelClass} p-5`}><button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }} className={`w-full rounded-xl border-2 border-dashed p-7 text-center focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow ${dragging || file ? "border-azure dark:border-yellow bg-azure/5 dark:bg-yellow/5" : "border-gray-200 dark:border-gray-700"}`}><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => choose(event.target.files?.[0])} />{file ? <div className="flex items-center justify-center gap-3"><FileSpreadsheet size={26} className="text-azure dark:text-yellow" /><div className="min-w-0 text-left"><p className="font-medium truncate">{file.name}</p><p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p></div><span onClick={(event) => { event.stopPropagation(); setFile(null); }} className="ml-auto w-8 h-8 grid place-items-center rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500" aria-label="Remove file"><X size={16} /></span></div> : <><Upload size={28} className="mx-auto text-gray-400" /><p className="mt-3 font-medium">Drop CSV here or browse</p><p className="mt-1 text-xs text-gray-500">Only .csv files accepted</p></>}</button>{error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>}<button disabled={!file || busy} onClick={() => void upload()} className={`${primaryCompactClass} w-full mt-4 py-3 text-sm`}><Upload size={16} />{busy ? "Processing…" : "Upload and register"}</button></section>
    </div>
    {progress && <section className={`${panelClass} p-5 mt-5`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2">{progress.status === "COMPLETED" ? <CheckCircle2 size={18} className="text-green-500" /> : <span className="w-2 h-2 rounded-full bg-yellow animate-pulse" />}<h2 className="text-sm font-semibold">{progress.status === "COMPLETED" ? "Processing complete" : "Processing rows"}</h2></div><span className="text-xs font-mono text-gray-500">{progress.currentRow}/{progress.totalRows}</span></div><div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-dark-card overflow-hidden"><div className={`h-full rounded-full ${progress.status === "COMPLETED" ? "bg-green-500" : "bg-azure dark:bg-yellow"}`} style={{ width: `${percent}%` }} /></div><div className="mt-4 grid grid-cols-3 gap-3 text-center"><Counter label="Processed" value={progress.currentRow} /><Counter label="Succeeded" value={progress.successCount} tone="text-green-500" /><Counter label="Failed" value={progress.errorCount} tone="text-red-500" /></div>{rowErrors.length > 0 && <div className="mt-4 max-h-52 overflow-y-auto rounded-xl border border-red-500/20 divide-y divide-red-500/10">{rowErrors.map((item, index) => <p key={`${item}-${index}`} className="p-3 text-xs text-red-600 dark:text-red-400">{item}</p>)}</div>}</section>}
  </AdminShell>;
}

function Counter({ label, value, tone = "" }: { label: string; value: number; tone?: string }) { return <div className="rounded-xl bg-gray-50 dark:bg-dark-card p-3"><p className={`text-xl font-bold font-mono ${tone}`}>{value}</p><p className="text-[10px] text-gray-500">{label}</p></div>; }

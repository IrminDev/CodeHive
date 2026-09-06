import { useCallback, useEffect, useState } from "react";
import { BellRing, Check, CircleAlert, Clock3, LoaderCircle, Mail, RotateCcw, Send } from "lucide-react";

import { getNotificationSettings, resetNotificationSettings, sendNotificationTestEmail, updateNotificationSettings, type NotificationSettings } from "~/features/student/api/notification.api";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import { TeacherShell } from "../components/TeacherShell";
import { compactButtonClass, inputClass, panelClass, TeacherError, TeacherLoading, TeacherPageHeader } from "../components/TeacherUI";

const REMINDERS = [{ value: 120, label: "2 hours before" }, { value: 1440, label: "1 day before" }, { value: 2880, label: "2 days before" }, { value: 10080, label: "1 week before" }];
const TIMEZONES = ["America/Mexico_City", "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Bogota", "America/Sao_Paulo", "Europe/London", "Europe/Madrid", "UTC"];
const descriptions: Record<string, string> = {
  STUDENT_ENROLLED: "When a student joins one of your groups.", STUDENT_LEFT: "When a student leaves a group.",
  SUBMISSION_RECEIVED: "When student work is delivered.", ASSIGNMENT_VALIDATION_FAILED: "When reference code or tests fail validation.",
  ASSIGNMENT_READY: "When generated outputs are ready.", ASSIGNMENT_DUE_SOON: "Reminder before an assignment due date.",
  ASSIGNMENT_CLOSE_SOON: "Reminder before an assignment closes.", ASSIGNMENT_GRADES_CLEARED: "When an assignment change clears existing grades.",
};
const label = (type: string) => type.split("_").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");

export function TeacherNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "reset" | "test" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); setError(null); try { setSettings(await getNotificationSettings()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load notification settings."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const patch = (next: Partial<NotificationSettings>) => { setSettings((current) => current ? { ...current, ...next } : current); setMessage(null); };
  const patchPreference = (type: string, next: Partial<NotificationSettings["preferences"][number]>) => setSettings((current) => current ? { ...current, preferences: current.preferences.map((item) => item.type === type ? { ...item, ...next } : item) } : current);

  async function act(kind: "save" | "reset" | "test") {
    if (!settings) return; setBusy(kind); setError(null);
    try {
      if (kind === "save") { setSettings(await updateNotificationSettings(settings)); setMessage("Notification preferences saved."); }
      else if (kind === "reset") { setSettings(await resetNotificationSettings()); setMessage("Defaults restored."); }
      else { await sendNotificationTestEmail(); setMessage("Test email sent. Check your inbox."); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Notification action failed."); }
    finally { setBusy(null); }
  }

  return <TeacherShell active="notifications" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Notifications" }]}>
    <TeacherPageHeader eyebrow="Email alerts" title="Notification settings" description="Choose which teaching events arrive in your inbox." actions={<button onClick={() => void act("reset")} disabled={loading || busy !== null} className={compactButtonClass}><RotateCcw size={13} /> Restore defaults</button>} />
    {loading ? <TeacherLoading rows={4} /> : error && !settings ? <TeacherError message={error} onRetry={() => void load()} /> : settings && <div className="space-y-6">
      {(error || message) && <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/5 text-red-500" : "border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400"}`}>{error ? <CircleAlert size={16} /> : <Check size={16} />}<span>{error ?? message}</span></div>}
      <section className={`${panelClass} p-5 lg:p-6`}><div className="flex flex-col sm:flex-row sm:items-center gap-4"><div className="w-10 h-10 rounded-xl bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow grid place-items-center"><Mail size={18} /></div><div className="flex-1"><h2 className="font-semibold">Email notifications</h2><p className="text-sm text-gray-500">Master control for teacher email alerts.</p></div><Toggle checked={settings.emailEnabled} onChange={(emailEnabled) => patch({ emailEnabled })} label="Enable email notifications" /></div><div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800/60 grid sm:grid-cols-[1fr_240px] gap-2 sm:items-center"><label htmlFor="teacher-timezone" className="text-sm font-medium">Timezone<span className="block text-xs font-normal text-gray-500">Used for deadline reminders.</span></label><input id="teacher-timezone" list="teacher-timezones" value={settings.timezone} onChange={(event) => patch({ timezone: event.target.value })} className={`${inputClass} py-2.5 text-sm`} /><datalist id="teacher-timezones">{TIMEZONES.map((zone) => <option key={zone} value={zone} />)}</datalist></div></section>
      <section className={`${panelClass} overflow-hidden ${settings.emailEnabled ? "" : "opacity-60"}`}><header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60"><div className="flex items-center gap-2"><BellRing size={16} className="text-azure dark:text-yellow" /><h2 className="font-semibold">Email types</h2></div></header><div className="divide-y divide-gray-100 dark:divide-gray-800/60">{settings.preferences.map((preference) => <div key={preference.type} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"><div className="flex-1 min-w-0"><h3 className="text-sm font-medium">{label(preference.type)}</h3><p className="mt-1 text-xs text-gray-500">{descriptions[preference.type] ?? "Email notification for this teaching event."}</p></div>{preference.reminderLeadMinutes != null && <label className="flex items-center gap-2 text-xs text-gray-500"><Clock3 size={13} /><Dropdown disabled={!settings.emailEnabled || !preference.enabled} value={preference.reminderLeadMinutes} onChange={(value) => patchPreference(preference.type, { reminderLeadMinutes: Number(value) })} size="compact" className="w-40" options={REMINDERS.map((option) => ({ value: option.value, label: option.label }))} /></label>}<Toggle checked={preference.enabled} disabled={!settings.emailEnabled} onChange={(enabled) => patchPreference(preference.type, { enabled })} label={`Enable ${label(preference.type)}`} /></div>)}</div></section>
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3"><button onClick={() => void act("test")} disabled={busy !== null} className={compactButtonClass}>{busy === "test" ? <LoaderCircle size={13} className="animate-spin" /> : <Send size={13} />} Send test email</button><button onClick={() => void act("save")} disabled={busy !== null} className="btn-primary inline-flex items-center justify-center gap-2">{busy === "save" && <LoaderCircle size={14} className="animate-spin" />}Save preferences</button></div>
    </div>}
  </TeacherShell>;
}

function Toggle({ checked, disabled = false, label: ariaLabel, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={ariaLabel} disabled={disabled} onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow disabled:opacity-50 ${checked ? "bg-azure dark:bg-yellow" : "bg-gray-300 dark:bg-gray-700"}`}><span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} /></button>;
}

import { useCallback, useEffect, useState } from "react";
import { BellRing, Check, CircleAlert, Clock3, LoaderCircle, Mail, RotateCcw, Send, SlidersHorizontal } from "lucide-react";
import { Dropdown } from "~/shared/components/ui/Dropdown";

import {
  getNotificationSettings,
  resetNotificationSettings,
  sendNotificationTestEmail,
  updateNotificationSettings,
  type NotificationSettings,
} from "../api/notification.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";

const REMINDER_OPTIONS = [
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
  { value: 10080, label: "1 week before" },
];

const TIMEZONE_SUGGESTIONS = [
  "America/Mexico_City",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Bogota",
  "America/Lima",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Madrid",
  "UTC",
];

function preferenceLabel(type: string): string {
  return type.split("_").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
}

function preferenceDescription(type: string): string {
  const descriptions: Record<string, string> = {
    ASSIGNMENT_PUBLISHED: "When teacher publishes new assignment.",
    ASSIGNMENT_DUE_SOON_NO_SUBMISSION: "Reminder when assignment due date approaches and no submission exists.",
    ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION: "Final reminder before assignment closes without submission.",
    ASSIGNMENT_RESCHEDULED: "When assignment deadline or availability changes.",
    ASSIGNMENT_UPDATED: "When teacher updates assignment content.",
    ASSIGNMENT_TESTS_UPDATED: "When teacher updates assignment test suite.",
    SUBMISSION_EVALUATED: "When submitted code receives final verdict.",
    SUBMISSION_REEVALUATED: "When teacher re-evaluates submission.",
    FEEDBACK_RECEIVED: "When teacher leaves feedback on your work.",
    GRADE_RETURNED: "When teacher returns grade.",
    REMOVED_FROM_GROUP: "When access to group changes.",
    GROUP_ARCHIVED: "When teacher archives group.",
  };
  return descriptions[type] ?? "Email notification for this event.";
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await getNotificationSettings());
    } catch (cause) {
      setSettings(null);
      setError(cause instanceof Error ? cause.message : "Could not load notification settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function patchSettings(patch: Partial<NotificationSettings>) {
    setSettings((current) => current ? { ...current, ...patch } : current);
    setMessage(null);
  }

  function patchPreference(type: string, patch: Partial<NotificationSettings["preferences"][number]>) {
    setSettings((current) => current ? {
      ...current,
      preferences: current.preferences.map((preference) => preference.type === type ? { ...preference, ...patch } : preference),
    } : current);
    setMessage(null);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      setSettings(await updateNotificationSettings(settings));
      setMessage("Notification preferences saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save notification settings.");
    } finally {
      setSaving(false);
    }
  }

  async function testEmail() {
    setTesting(true);
    setError(null);
    try {
      await sendNotificationTestEmail();
      setMessage("Test email sent. Check your inbox.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send test email.");
    } finally {
      setTesting(false);
    }
  }

  async function reset() {
    setResetting(true);
    setError(null);
    try {
      setSettings(await resetNotificationSettings());
      setShowResetConfirm(false);
      setMessage("Notification defaults restored.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset notification settings.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="notifications" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Notifications" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3"><BellRing size={13} className="text-yellow" /> EMAIL ALERTS</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification settings</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose which CodeHive updates arrive in your inbox.</p>
              </div>
              <button onClick={() => setShowResetConfirm(true)} disabled={loading || resetting} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"><RotateCcw size={13} /> Restore defaults</button>
            </div>

            {loading ? (
              <div className="space-y-5 animate-pulse"><div className="h-36 rounded-2xl bg-gray-100 dark:bg-dark-surface" /><div className="h-96 rounded-2xl bg-gray-100 dark:bg-dark-surface" /></div>
            ) : error && !settings ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert className="mx-auto text-red-500 mb-3" size={28} /><h2 className="font-semibold">Could not load settings</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p><button onClick={() => void load()} className="btn-primary mt-5">Try again</button></div>
            ) : settings && (
              <>
                {(error || message) && <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? "bg-red-500/5 border-red-500/20 text-red-500" : "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"}`}>{error ? <CircleAlert size={16} className="mt-0.5 flex-shrink-0" /> : <Check size={16} className="mt-0.5 flex-shrink-0" />}<p>{error ?? message}</p></div>}

                <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-5 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow grid place-items-center flex-shrink-0"><Mail size={18} /></div><div><h2 className="font-semibold text-gray-900 dark:text-white">Email notifications</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Master control for every CodeHive email alert.</p></div></div>
                    <Toggle checked={settings.emailEnabled} onChange={(emailEnabled) => patchSettings({ emailEnabled })} label="Enable email notifications" />
                  </div>
                  <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800/60 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center"><label htmlFor="notification-timezone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Timezone<span className="block mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">Used for deadline and reminder times.</span></label><input id="notification-timezone" list="notification-timezones" value={settings.timezone} onChange={(event) => patchSettings({ timezone: event.target.value })} maxLength={80} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow" /><datalist id="notification-timezones">{TIMEZONE_SUGGESTIONS.map((timezone) => <option key={timezone} value={timezone} />)}</datalist></div>
                </section>

                <section className={`rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden ${!settings.emailEnabled ? "opacity-60" : ""}`}>
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60"><div className="flex items-center gap-2"><SlidersHorizontal size={16} className="text-azure dark:text-yellow" /><h2 className="font-semibold text-gray-900 dark:text-white">Email types</h2></div><p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Control each notification separately. Reminder timing applies only to deadline alerts.</p></div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{settings.preferences.map((preference) => <div key={preference.type} className="px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">{preferenceLabel(preference.type)}</h3><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{preferenceDescription(preference.type)}</p></div>{preference.reminderLeadMinutes != null && <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Clock3 size={13} /><span className="sr-only">Reminder time for {preferenceLabel(preference.type)}</span><Dropdown disabled={!settings.emailEnabled || !preference.enabled} value={preference.reminderLeadMinutes} onChange={(value) => patchPreference(preference.type, { reminderLeadMinutes: Number(value) })} size="compact" className="w-40" options={REMINDER_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} /></label>}<Toggle checked={preference.enabled} onChange={(enabled) => patchPreference(preference.type, { enabled })} disabled={!settings.emailEnabled} label={`Enable ${preferenceLabel(preference.type)}`} /></div>)}</div>
                </section>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3"><button onClick={() => void testEmail()} disabled={testing} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50">{testing ? <LoaderCircle size={13} className="animate-spin" /> : <Send size={13} />} Send test email</button><button onClick={() => void save()} disabled={saving} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french transition-colors disabled:opacity-50">{saving && <LoaderCircle size={13} className="animate-spin" />}{saving ? "Saving…" : "Save preferences"}</button></div>
              </>
            )}
          </div>
        </main>
      </div>

      {showResetConfirm && <div className="fixed inset-0 z-50 grid place-items-center bg-dark-bg/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="reset-notifications-title"><div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card p-6 shadow-xl"><div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 grid place-items-center"><RotateCcw size={20} /></div><h2 id="reset-notifications-title" className="mt-4 text-lg font-semibold">Restore notification defaults?</h2><p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Custom email choices and reminder times will be removed. CodeHive defaults will apply again.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setShowResetConfirm(false)} disabled={resetting} className="btn-outline">Cancel</button><button onClick={() => void reset()} disabled={resetting} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">{resetting && <LoaderCircle size={14} className="animate-spin" />}{resetting ? "Restoring…" : "Restore defaults"}</button></div></div></div>}
    </div>
  );
}

function Toggle({ checked, disabled = false, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow focus:ring-offset-2 dark:focus:ring-offset-dark-surface disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-azure dark:bg-yellow" : "bg-gray-300 dark:bg-gray-700"}`}><span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} /></button>;
}

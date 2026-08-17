import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { getTeacherAssignment, updateAssignment } from "../api/assignment.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type { ComparatorType, Language, TeacherAssignment, UpdateAssignmentMetadata } from "../types/assignment.types";

const LANGUAGES: Language[] = ["PYTHON", "JAVA", "CPP", "C"];
const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface";

function csv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function toInstant(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export function EditAssignmentPage() {
  const navigate = useNavigate();
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [hints, setHints] = useState("");
  const [tags, setTags] = useState("");
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [maxPoints, setMaxPoints] = useState(100);
  const [comparatorType, setComparatorType] = useState<ComparatorType>("EXACT_MATCH");
  const [allowedLanguages, setAllowedLanguages] = useState<Language[]>([]);
  const [launchDate, setLaunchDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [clearLaunchDate, setClearLaunchDate] = useState(false);
  const [clearDueDate, setClearDueDate] = useState(false);
  const [clearCloseDate, setClearCloseDate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getTeacherAssignment(assignmentId)
      .then((item) => {
        if (cancelled) return;
        setAssignment(item);
        setTitle(item.title);
        setDescription(item.description);
        setConstraints(item.constraints.join(", "));
        setHints(item.hints.join(", "));
        setTags(item.tags.join(", "));
        setTimeLimitMs(item.timeLimitMs);
        setMemoryLimitMb(item.memoryLimitMb);
        setMaxPoints(item.maxPoints);
        setComparatorType(item.comparatorType);
        setAllowedLanguages(item.allowedLanguages);
      })
      .catch((error) => sileo.error({ title: error instanceof Error ? error.message : "Failed to load assignment." }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assignmentId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!allowedLanguages.length) {
      sileo.error({ title: "Select at least one allowed language." });
      return;
    }
    const metadata: UpdateAssignmentMetadata = {
      title: title.trim(),
      description: description.trim(),
      constraints: csv(constraints),
      hints: csv(hints),
      tags: csv(tags),
      timeLimitMs,
      memoryLimitMb,
      maxPoints,
      comparatorType,
      allowedLanguages,
      ...(clearLaunchDate ? { clearLaunchDate: true } : launchDate ? { launchDate: toInstant(launchDate) } : {}),
      ...(clearDueDate ? { clearDueDate: true } : dueDate ? { dueDate: toInstant(dueDate) } : {}),
      ...(clearCloseDate ? { clearCloseDate: true } : closeDate ? { closeDate: toInstant(closeDate) } : {}),
    };
    setSaving(true);
    try {
      const update = await updateAssignment(assignmentId, metadata);
      sileo.success({ title: update.status === "VALIDATING" ? "Update queued for validation." : "Assignment updated." });
      navigate("/teacher/assignments");
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to update assignment." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">Loading assignment…</div>;
  if (!assignment) return <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">Assignment not found.</div>;

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <form onSubmit={submit} className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-4"><button type="button" onClick={() => navigate("/teacher/assignments")} className="btn-outline p-2.5"><ArrowLeft size={16} /></button><div><p className="text-xs uppercase tracking-widest font-semibold text-azure dark:text-yellow">Assignment management</p><h1 className="text-3xl font-bold mt-1">Edit assignment</h1><p className="text-gray-500 mt-1">Metadata applies immediately. Date fields left empty remain unchanged.</p></div></div>
        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
          <label className="grid gap-2 text-sm">Title<input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label>
          <label className="grid gap-2 text-sm">Description<textarea required rows={6} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></label>
          <div className="grid md:grid-cols-3 gap-4"><label className="grid gap-2 text-sm">Constraints<input value={constraints} onChange={(event) => setConstraints(event.target.value)} className={inputClass} /></label><label className="grid gap-2 text-sm">Hints<input value={hints} onChange={(event) => setHints(event.target.value)} className={inputClass} /></label><label className="grid gap-2 text-sm">Tags<input value={tags} onChange={(event) => setTags(event.target.value)} className={inputClass} /></label></div>
          <div className="grid md:grid-cols-4 gap-4"><label className="grid gap-2 text-sm">Time limit<input type="number" min={100} max={10000} value={timeLimitMs} onChange={(event) => setTimeLimitMs(Number(event.target.value))} className={inputClass} /></label><label className="grid gap-2 text-sm">Memory limit<input type="number" min={16} max={1000} value={memoryLimitMb} onChange={(event) => setMemoryLimitMb(Number(event.target.value))} className={inputClass} /></label><label className="grid gap-2 text-sm">Max points<input type="number" min="0.01" step="0.01" value={maxPoints} onChange={(event) => setMaxPoints(Number(event.target.value))} className={inputClass} /></label><label className="grid gap-2 text-sm">Comparator<select value={comparatorType} onChange={(event) => setComparatorType(event.target.value as ComparatorType)} className={inputClass}><option value="EXACT_MATCH">Exact match</option><option value="FLOATING_POINT">Floating point</option></select></label></div>
          <div><p className="text-sm mb-2">Allowed languages</p><div className="flex flex-wrap gap-4">{LANGUAGES.map((language) => <label key={language} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={allowedLanguages.includes(language)} onChange={() => setAllowedLanguages((items) => items.includes(language) ? items.filter((item) => item !== language) : [...items, language])} />{language}</label>)}</div></div>
        </section>
        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5"><h2 className="font-semibold text-lg">Reschedule</h2><div className="grid md:grid-cols-3 gap-4">{[["Launch", assignment.launchDate, launchDate, setLaunchDate, clearLaunchDate, setClearLaunchDate], ["Due", assignment.dueDate, dueDate, setDueDate, clearDueDate, setClearDueDate], ["Close", assignment.closeDate, closeDate, setCloseDate, clearCloseDate, setClearCloseDate]].map(([label, current, value, setValue, clear, setClear]) => <div key={label as string} className="grid gap-2"><label className="text-sm">{label as string} <span className="text-gray-500">current: {current ? new Date(current as string).toLocaleString() : "none"}</span></label><input type="datetime-local" min={new Date().toISOString().slice(0, 16)} disabled={clear as boolean} value={value as string} onChange={(event) => (setValue as React.Dispatch<React.SetStateAction<string>>)(event.target.value)} className={inputClass} /><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={clear as boolean} onChange={(event) => (setClear as React.Dispatch<React.SetStateAction<boolean>>)(event.target.checked)} />Clear date</label></div>)}</div></section>
        <div className="flex justify-end gap-3 pb-8"><button type="button" onClick={() => navigate("/teacher/assignments")} className="btn-outline">Cancel</button><button disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button></div>
      </form>
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import {
  cloneAssignment,
  getActiveTeacherGroups,
  getCloneAssignmentForm,
} from "../api/assignment.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type {
  AssignmentExample,
  CloneAssignmentForm,
  ComparatorType,
  Language,
} from "../types/assignment.types";
import type { TeacherGroup } from "../types/group.types";
import { TeacherShell } from "../components/TeacherShell";
import { TeacherEmpty, TeacherLoading } from "../components/TeacherUI";

const LANGUAGES: Language[] = ["PYTHON", "JAVA", "CPP", "C"];

function localDateTimeMinimum(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 1, 0, 0);
  return now.toISOString().slice(0, 16);
}

function toInstant(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

function csv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function fieldClass(): string {
  return "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface text-gray-900 dark:text-white";
}

export function CloneAssignmentPage() {
  const navigate = useNavigate();
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();
  const [form, setForm] = useState<CloneAssignmentForm | null>(null);
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const minimumDate = useMemo(localDateTimeMinimum, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getCloneAssignmentForm(assignmentId),
      getActiveTeacherGroups(),
    ])
      .then(([snapshot, activeGroups]) => {
        if (cancelled) return;
        setForm(snapshot);
        setGroups(activeGroups);
        setTargetGroupId(activeGroups.find((group) => group.id !== snapshot.sourceGroupId)?.id ?? "");
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load clone form." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [assignmentId]);

  function patch<K extends keyof CloneAssignmentForm>(key: K, value: CloneAssignmentForm[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function patchTestCase(index: number, next: Partial<CloneAssignmentForm["testCases"][number]>) {
    if (!form) return;
    patch("testCases", form.testCases.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item));
  }

  function patchExample(index: number, next: Partial<AssignmentExample>) {
    if (!form) return;
    patch("examples", form.examples.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !targetGroupId) {
      sileo.error({ title: "Select a destination group." });
      return;
    }
    if (!form.allowedLanguages.length) {
      sileo.error({ title: "Select at least one allowed language." });
      return;
    }
    if (!form.testCases.length || form.testCases.some((testCase) => !testCase.input.trim())) {
      sileo.error({ title: "Every test case needs input." });
      return;
    }
    if (form.testCases.length > 50) {
      sileo.error({ title: "An assignment can have at most 50 test cases." });
      return;
    }
    const launch = toInstant(launchDate);
    const due = toInstant(dueDate);
    const close = toInstant(closeDate);
    if ((launch && due && launch > due) || (due && close && due > close) || (launch && close && launch > close)) {
      sileo.error({ title: "Dates must satisfy launch ≤ due ≤ close." });
      return;
    }
    setSubmitting(true);
    try {
      await cloneAssignment(assignmentId, {
        targetGroupId,
        title: form.title.trim(),
        description: form.description.trim(),
        constraints: form.constraints,
        hints: form.hints,
        tags: form.tags,
        timeLimitMs: form.timeLimitMs,
        memoryLimitMb: form.memoryLimitMb,
        comparatorType: form.comparatorType,
        allowedLanguages: form.allowedLanguages,
        referenceLanguage: form.referenceLanguage,
        referenceSolution: form.referenceSolution,
        testCases: form.testCases.map(({ input, sample }) => ({ input, sample })),
        examples: form.examples,
        maxPoints: form.maxPoints,
        launchDate: launch,
        dueDate: due,
        closeDate: close,
      });
      sileo.success({ title: "Assignment cloned. Test generation started." });
      navigate("/teacher/assignments");
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to clone assignment." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <TeacherShell active="assignments" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments", to: "/teacher/assignments" }, { label: "Clone" }]}><TeacherLoading rows={5} /></TeacherShell>;
  }
  if (!form) {
    return <TeacherShell active="assignments" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments", to: "/teacher/assignments" }, { label: "Clone" }]}><TeacherEmpty title="Clone unavailable" description="Assignment source could not be loaded or is no longer available." /></TeacherShell>;
  }

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <form onSubmit={submit} className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => navigate("/teacher/assignments")} className="btn-outline p-2.5" aria-label="Back">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-azure dark:text-yellow uppercase">Reuse assignment</p>
            <h1 className="text-3xl font-bold mt-1">Clone assignment</h1>
            <p className="text-gray-500 mt-1">All fields are editable. Scheduling starts empty.</p>
          </div>
        </div>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
          <h2 className="font-semibold text-lg">Destination and schedule</h2>
          <label className="grid gap-2 text-sm">Destination group
            <select required value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)} className={fieldClass()}>
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} disabled={group.id === form.sourceGroupId}>
                  {group.name}{group.id === form.sourceGroupId ? " (source group)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ["Launch", launchDate, setLaunchDate],
              ["Due", dueDate, setDueDate],
              ["Close", closeDate, setCloseDate],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="grid gap-2 text-sm">{label as string}
                <input type="datetime-local" min={minimumDate} value={value as string} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)} className={fieldClass()} />
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
          <h2 className="font-semibold text-lg">Assignment information</h2>
          <label className="grid gap-2 text-sm">Title<input required value={form.title} onChange={(event) => patch("title", event.target.value)} className={fieldClass()} /></label>
          <label className="grid gap-2 text-sm">Description<textarea required rows={5} value={form.description} onChange={(event) => patch("description", event.target.value)} className={fieldClass()} /></label>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="grid gap-2 text-sm">Constraints<input value={form.constraints.join(", ")} onChange={(event) => patch("constraints", csv(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Hints<input value={form.hints.join(", ")} onChange={(event) => patch("hints", csv(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Tags<input value={form.tags.join(", ")} onChange={(event) => patch("tags", csv(event.target.value))} className={fieldClass()} /></label>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <label className="grid gap-2 text-sm">Time limit (ms)<input type="number" min={100} max={10000} required value={form.timeLimitMs} onChange={(event) => patch("timeLimitMs", Number(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Memory (MB)<input type="number" min={16} max={1000} required value={form.memoryLimitMb} onChange={(event) => patch("memoryLimitMb", Number(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Max points<input type="number" min="0.01" step="0.01" required value={form.maxPoints} onChange={(event) => patch("maxPoints", Number(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Comparator<select value={form.comparatorType} onChange={(event) => patch("comparatorType", event.target.value as ComparatorType)} className={fieldClass()}><option value="EXACT_MATCH">Exact match</option><option value="FLOATING_POINT">Floating point</option></select></label>
          </div>
          <div>
            <p className="text-sm mb-2">Allowed languages</p>
            <div className="flex flex-wrap gap-3">
              {LANGUAGES.map((language) => <label key={language} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowedLanguages.includes(language)} onChange={() => patch("allowedLanguages", form.allowedLanguages.includes(language) ? form.allowedLanguages.filter((item) => item !== language) : [...form.allowedLanguages, language])} />{language}</label>)}
            </div>
          </div>
          <label className="grid gap-2 text-sm">Reference language<select value={form.referenceLanguage} onChange={(event) => patch("referenceLanguage", event.target.value as Language)} className={fieldClass()}>{LANGUAGES.map((language) => <option key={language}>{language}</option>)}</select></label>
        </section>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-4">
          <h2 className="font-semibold text-lg">Reference solution</h2>
          <textarea required rows={16} value={form.referenceSolution} onChange={(event) => patch("referenceSolution", event.target.value)} className={`${fieldClass()} font-mono text-sm`} />
        </section>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-lg">Test cases</h2><button type="button" disabled={form.testCases.length >= 50} onClick={() => patch("testCases", [...form.testCases, { order: form.testCases.length + 1, input: "", sample: false }])} className="btn-outline inline-flex items-center gap-1"><Plus size={14} /> Add</button></div>
          {form.testCases.map((testCase, index) => (
            <div key={`${testCase.order}-${index}`} className="grid gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-surface">
              <div className="flex justify-between"><strong className="text-sm">Test {index + 1}</strong>{form.testCases.length > 1 && <button type="button" onClick={() => patch("testCases", form.testCases.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500"><Trash2 size={15} /></button>}</div>
              <textarea required rows={4} value={testCase.input} onChange={(event) => patchTestCase(index, { input: event.target.value })} className={`${fieldClass()} font-mono text-sm`} />
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={testCase.sample} onChange={(event) => patchTestCase(index, { sample: event.target.checked })} />Visible sample</label>
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-lg">Examples</h2><button type="button" onClick={() => patch("examples", [...form.examples, { input: "", output: "", explanation: "" }])} className="btn-outline inline-flex items-center gap-1"><Plus size={14} /> Add</button></div>
          {form.examples.length === 0 && <p className="text-sm text-gray-500">No examples.</p>}
          {form.examples.map((example, index) => (
            <div key={index} className="grid md:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-surface">
              <textarea rows={3} placeholder="Input" value={example.input} onChange={(event) => patchExample(index, { input: event.target.value })} className={fieldClass()} />
              <textarea rows={3} placeholder="Output" value={example.output} onChange={(event) => patchExample(index, { output: event.target.value })} className={fieldClass()} />
              <input placeholder="Explanation" value={example.explanation ?? ""} onChange={(event) => patchExample(index, { explanation: event.target.value })} className={`${fieldClass()} md:col-span-2`} />
              <button type="button" onClick={() => patch("examples", form.examples.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500 justify-self-start text-sm">Remove example</button>
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={() => navigate("/teacher/assignments")} className="btn-outline">Cancel</button>
          <button disabled={submitting || !targetGroupId} className="btn-primary">{submitting ? "Cloning…" : "Clone assignment"}</button>
        </div>
      </form>
    </DashboardLayout>
  );
}

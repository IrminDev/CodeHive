import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { sileo } from "sileo";

import { CodeEditor } from "~/shared/components/CodeEditor";
import { CalendarInput } from "~/shared/components/ui/CalendarInput";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import {
  cloneAssignment,
  getActiveTeacherGroups,
  getCloneAssignmentForm,
} from "../api/assignment.api";
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

const LANGUAGE_DETAILS: Record<Language, { label: string; extension: string; monaco: string }> = {
  PYTHON: { label: "Python", extension: "py", monaco: "python" },
  JAVA: { label: "Java", extension: "java", monaco: "java" },
  CPP: { label: "C++", extension: "cpp", monaco: "cpp" },
  C: { label: "C", extension: "c", monaco: "c" },
};

const MAX_SOURCE_LINES = 500;
const MAX_SOURCE_BYTES = 256 * 1024;
const MAX_TEST_INPUT_BYTES = 1024 * 1024;
const MAX_SUPPORTING_TEXT_CHARS = 5_000;
const MAX_TAGS = 10;
const MAX_TAG_CHARS = 50;

function localDateTimeMinimum(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 1, 0, 0);
  return now.toISOString().slice(0, 16);
}

function toInstant(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function byteSize(value: string): number {
  return new Blob([value]).size;
}

function lineCount(value: string): number {
  return value ? value.split("\n").length : 0;
}

function fieldClass(): string {
  return "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow focus:border-transparent";
}

const sectionClass = "bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-gray-800/60 p-5 sm:p-6";
const secondaryButtonClass = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-azure/50 hover:bg-azure/5 hover:text-azure focus:outline-none focus:ring-2 focus:ring-azure disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-dark-card dark:hover:text-gray-100";

function SectionHeading({ number, title, description, badge }: {
  number: string;
  title: string;
  description: string;
  badge: "Required" | "Optional";
}) {
  return (
    <div className="min-w-0 flex-1 border-b border-gray-100 pb-4 dark:border-gray-800/60">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-semibold text-gray-400 dark:text-gray-600">{number}</span>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500 dark:border-gray-700/60 dark:bg-dark-card dark:text-gray-400">{badge}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export function CloneAssignmentPage() {
  const navigate = useNavigate();
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();
  const [form, setForm] = useState<CloneAssignmentForm | null>(null);
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [publishMode, setPublishMode] = useState<"immediately" | "scheduled">("immediately");
  const [launchDate, setLaunchDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [constraintsText, setConstraintsText] = useState("");
  const [hintsText, setHintsText] = useState("");
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
        setConstraintsText(snapshot.constraints.join("\n"));
        setHintsText(snapshot.hints.join("\n"));
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

  function addTag() {
    if (!form) return;
    const tag = tagInput.trim().toUpperCase();
    if (!tag) return;
    if (form.tags.length >= MAX_TAGS) {
      sileo.error({ title: `Use at most ${MAX_TAGS} tags.` });
      return;
    }
    if (!form.tags.some((item) => item.toUpperCase() === tag)) patch("tags", [...form.tags, tag]);
    setTagInput("");
  }

  function updateReferenceSolution(value: string) {
    if (lineCount(value) > MAX_SOURCE_LINES) {
      sileo.error({ title: `Reference solution cannot exceed ${MAX_SOURCE_LINES} lines.` });
      return;
    }
    if (byteSize(value) > MAX_SOURCE_BYTES) {
      sileo.error({ title: "Reference solution cannot exceed 256 KB." });
      return;
    }
    patch("referenceSolution", value);
  }

  function updateTestInput(index: number, value: string) {
    if (byteSize(value) > MAX_TEST_INPUT_BYTES) {
      sileo.error({ title: "Test input cannot exceed 1 MB." });
      return;
    }
    patchTestCase(index, { input: value });
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
    if (!form.referenceSolution.trim()) {
      sileo.error({ title: "Reference solution is required." });
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
    if (publishMode === "scheduled" && !launchDate) {
      sileo.error({ title: "Choose a launch date for scheduled publishing." });
      return;
    }
    const launch = publishMode === "scheduled" ? toInstant(launchDate) : undefined;
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
        constraints: lines(constraintsText),
        hints: lines(hintsText),
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

  const referenceLanguage = LANGUAGE_DETAILS[form.referenceLanguage];
  const selectedGroup = groups.find((group) => group.id === targetGroupId);

  return (
    <TeacherShell active="assignments" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments", to: "/teacher/assignments" }, { label: "Clone assignment" }]}>
      <form onSubmit={submit} className="mx-auto max-w-5xl space-y-5 pb-8">
        <div className="mb-8 flex items-start gap-4">
          <button type="button" onClick={() => navigate("/teacher/assignments")} className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-all hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white" aria-label="Back">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gray-600 dark:border-gray-700/60 dark:bg-dark-card dark:text-gray-300">Clone assignment</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reuse assignment</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Review copied content, choose destination, then generate fresh expected outputs.</p>
          </div>
          <div className="hidden items-center gap-2 pt-2 lg:flex">
            {["Review", "Configure", "Publish"].map((step, index) => <div key={step} className="flex items-center gap-2"><span className={`text-xs font-bold ${index === 0 ? "text-azure" : "text-gray-500"}`}>{index + 1}.</span><span className={`text-xs font-medium ${index === 0 ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>{step}</span>{index < 2 && <span className="text-xs text-gray-300 dark:text-gray-700">——</span>}</div>)}
          </div>
        </div>

        <section className={`${sectionClass} grid gap-5`}>
          <SectionHeading number="01" title="Destination and publishing" description="Choose where this clone lives and when students can see it." badge="Required" />
          <label className="grid gap-2 text-sm">Destination group
            <Dropdown required value={targetGroupId} onChange={setTargetGroupId} placeholder="Select group" options={groups.map((group) => ({ value: group.id, label: group.name, description: group.id === form.sourceGroupId ? "Source group" : undefined, disabled: group.id === form.sourceGroupId }))} />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button type="button" aria-pressed={publishMode === "immediately"} onClick={() => { setPublishMode("immediately"); setLaunchDate(""); }} className={`rounded-xl border p-4 text-left transition-colors ${publishMode === "immediately" ? "border-azure bg-azure/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-700/60 dark:hover:border-gray-600"}`}>
              <span className={`flex items-center gap-2 text-sm font-semibold ${publishMode === "immediately" ? "text-azure dark:text-yellow" : "text-gray-700 dark:text-gray-300"}`}><CheckCircle2 size={16} /> Publish immediately</span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">Visible as soon as worker validation succeeds.</span>
            </button>
            <button type="button" aria-pressed={publishMode === "scheduled"} onClick={() => setPublishMode("scheduled")} className={`rounded-xl border p-4 text-left transition-colors ${publishMode === "scheduled" ? "border-yellow bg-yellow/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-700/60 dark:hover:border-gray-600"}`}>
              <span className={`flex items-center gap-2 text-sm font-semibold ${publishMode === "scheduled" ? "text-yellow" : "text-gray-700 dark:text-gray-300"}`}><CalendarClock size={16} /> Schedule publish</span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">Keep hidden until selected launch date.</span>
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {publishMode === "scheduled" && <label className="grid gap-2 text-sm">Launch date<CalendarInput required type="datetime-local" min={minimumDate} value={launchDate} onChange={setLaunchDate} /></label>}
            <label className="grid gap-2 text-sm">Due date <span className="text-xs font-normal text-gray-500">Optional</span><CalendarInput type="datetime-local" min={(publishMode === "scheduled" && launchDate) || minimumDate} value={dueDate} onChange={setDueDate} /></label>
            <label className="grid gap-2 text-sm">Close date <span className="text-xs font-normal text-gray-500">Optional</span><CalendarInput type="datetime-local" min={dueDate || (publishMode === "scheduled" && launchDate) || minimumDate} value={closeDate} onChange={setCloseDate} /></label>
          </div>
        </section>

        <section className={`${sectionClass} grid gap-5`}>
          <SectionHeading number="02" title="Assignment information" description="Review challenge details, scoring, and execution limits." badge="Required" />
          <label className="grid gap-2 text-sm">Title<input required value={form.title} onChange={(event) => patch("title", event.target.value)} className={fieldClass()} /></label>
          <label className="grid gap-2 text-sm">Description<textarea required rows={5} value={form.description} onChange={(event) => patch("description", event.target.value)} className={fieldClass()} /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">Constraints <span className="text-xs font-normal text-gray-500">One per line</span><textarea rows={3} maxLength={MAX_SUPPORTING_TEXT_CHARS} value={constraintsText} onChange={(event) => setConstraintsText(event.target.value)} className={`${fieldClass()} resize-none`} /><span className="text-right text-[11px] font-normal text-gray-500">{constraintsText.length} / {MAX_SUPPORTING_TEXT_CHARS}</span></label>
            <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">Hints <span className="text-xs font-normal text-gray-500">One per line</span><textarea rows={3} maxLength={MAX_SUPPORTING_TEXT_CHARS} value={hintsText} onChange={(event) => setHintsText(event.target.value)} className={`${fieldClass()} resize-none`} /><span className="text-right text-[11px] font-normal text-gray-500">{hintsText.length} / {MAX_SUPPORTING_TEXT_CHARS}</span></label>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tags</p>
            <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-dark-card">
              {form.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-yellow/40 bg-yellow/5 px-3 py-1 text-xs font-semibold text-yellow">{tag}<button type="button" onClick={() => patch("tags", form.tags.filter((item) => item !== tag))} className="transition-colors hover:text-gray-900 dark:hover:text-white" aria-label={`Remove ${tag}`}><X size={11} /></button></span>)}
              <div className="flex min-w-28 flex-1 items-center gap-1">
                <input value={tagInput} onChange={(event) => setTagInput(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); } }} maxLength={MAX_TAG_CHARS} placeholder="Add tag…" className="min-w-24 flex-1 border-none bg-transparent px-1 py-1 text-xs text-gray-800 outline-none placeholder:text-gray-400 dark:text-yellow dark:placeholder:text-gray-600" />
                {tagInput && <button type="button" onClick={addTag} className="text-xs font-medium text-azure transition-colors hover:text-french dark:text-yellow dark:hover:text-white">+ add</button>}
              </div>
            </div>
            <p className="mt-1 text-right text-[11px] text-gray-500">{form.tags.length} / {MAX_TAGS} tags · {tagInput.length} / {MAX_TAG_CHARS} characters</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <label className="grid gap-2 text-sm">Time limit (ms)<input type="number" min={100} max={10000} required value={form.timeLimitMs} onChange={(event) => patch("timeLimitMs", Number(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Memory (MB)<input type="number" min={16} max={1000} required value={form.memoryLimitMb} onChange={(event) => patch("memoryLimitMb", Number(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Max points<input type="number" min="0.01" step="0.01" required value={form.maxPoints} onChange={(event) => patch("maxPoints", Number(event.target.value))} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm">Comparator<Dropdown value={form.comparatorType} onChange={(value) => patch("comparatorType", value as ComparatorType)} options={[{ value: "EXACT_MATCH", label: "Exact match" }, { value: "FLOATING_POINT", label: "Floating point" }]} /></label>
          </div>
          <div className="grid gap-3">
            <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">Allowed languages</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Students can submit using any selected language.</p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LANGUAGES.map((language) => {
                const details = LANGUAGE_DETAILS[language];
                const selected = form.allowedLanguages.includes(language);
                return <button key={language} type="button" aria-pressed={selected} onClick={() => patch("allowedLanguages", selected ? form.allowedLanguages.filter((item) => item !== language) : [...form.allowedLanguages, language])} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${selected ? "border-azure bg-azure/10 text-azure" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-400 dark:border-gray-700 dark:bg-dark-card dark:text-gray-400"}`}><span>{details.label}</span>{selected && <Check size={15} />}</button>;
              })}
            </div>
          </div>
        </section>

        <section className={`${sectionClass} grid gap-5`}>
          <SectionHeading number="03" title="Reference solution" description="Edit source used by CodeHive to generate expected outputs." badge="Required" />
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 bg-dark-surface px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex gap-1.5" aria-hidden="true"><span className="h-3 w-3 rounded-full bg-red-500" /><span className="h-3 w-3 rounded-full bg-yellow" /><span className="h-3 w-3 rounded-full bg-green-500" /></span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-gray-400"><Code2 size={13} className="text-yellow" /> solution.{referenceLanguage.extension}</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-400">Language
                <Dropdown value={form.referenceLanguage} onChange={(value) => patch("referenceLanguage", value as Language)} options={LANGUAGES.map((language) => ({ value: language, label: LANGUAGE_DETAILS[language].label }))} size="compact" className="w-32" />
              </label>
            </div>
            <div className="h-[360px] sm:h-[440px]">
              <CodeEditor language={referenceLanguage.monaco} value={form.referenceSolution} onChange={updateReferenceSolution} height="100%" options={{ wordWrap: "on", tabSize: 4 }} />
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-dark-surface dark:text-gray-400">
              <span>{lineCount(form.referenceSolution)} / {MAX_SOURCE_LINES} lines</span>
              <span>{byteSize(form.referenceSolution).toLocaleString()} / {MAX_SOURCE_BYTES.toLocaleString()} bytes</span>
            </div>
          </div>
        </section>

        <section className={`${sectionClass} grid gap-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeading number="04" title="Test cases" description="Private inputs generate expected outputs from reference solution." badge="Required" />
            <button type="button" disabled={form.testCases.length >= 50} onClick={() => patch("testCases", [...form.testCases, { order: form.testCases.length + 1, input: "", sample: false }])} className={`${secondaryButtonClass} shrink-0 self-start`}><Plus size={14} /> Add test</button>
          </div>
          <div className="grid gap-4">
          {form.testCases.map((testCase, index) => (
            <div key={`${testCase.order}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 transition-colors hover:border-azure/30 dark:border-gray-700/50">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700/30 dark:bg-dark-card">
                <div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold text-gray-400">{String(index + 1).padStart(2, "0")}</span><div><strong className="block text-sm text-gray-900 dark:text-gray-100">Test case {index + 1}</strong><span className="block text-[11px] text-gray-500 dark:text-gray-400">stdin · {byteSize(testCase.input).toLocaleString()} bytes</span></div></div>
                {form.testCases.length > 1 && <button type="button" aria-label={`Delete test ${index + 1}`} onClick={() => patch("testCases", form.testCases.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500"><Trash2 size={15} /></button>}
              </div>
              <div className="grid gap-3 p-4">
                <textarea required rows={5} aria-label={`Test ${index + 1} input`} value={testCase.input} onChange={(event) => updateTestInput(index, event.target.value)} className={`${fieldClass()} resize-y font-mono text-sm`} />
                <label className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${testCase.sample ? "border-azure/30 bg-azure/10" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-dark-card"}`}>
                  <span><span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">Visible sample</span><span className="block text-[11px] text-gray-500 dark:text-gray-400">Students can inspect this input before submitting.</span></span>
                  <input type="checkbox" checked={testCase.sample} onChange={(event) => patchTestCase(index, { sample: event.target.checked })} className="h-4 w-4 accent-azure" />
                </label>
              </div>
            </div>
          ))}
          </div>
        </section>

        <section className={`${sectionClass} grid gap-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeading number="05" title="Public examples" description="Show students how input maps to expected output." badge="Optional" />
            <button type="button" onClick={() => patch("examples", [...form.examples, { input: "", output: "", explanation: "" }])} className={`${secondaryButtonClass} shrink-0 self-start`}><Plus size={14} /> Add example</button>
          </div>
          {form.examples.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center dark:border-gray-700 dark:bg-dark-surface"><BookOpen size={22} className="mx-auto text-gray-400" /><p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">No public examples yet</p><p className="mt-1 text-xs text-gray-500">Examples are optional but help students understand formatting.</p></div>}
          {form.examples.map((example, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700/30 dark:bg-dark-card"><div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold text-gray-400">{String(index + 1).padStart(2, "0")}</span><strong className="text-sm text-gray-900 dark:text-gray-100">Example {index + 1}</strong></div><button type="button" aria-label={`Delete example ${index + 1}`} onClick={() => patch("examples", form.examples.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500"><Trash2 size={15} /></button></div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">Input<textarea rows={4} value={example.input} onChange={(event) => patchExample(index, { input: event.target.value })} className={`${fieldClass()} font-mono`} /></label>
                <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">Expected output<textarea rows={4} value={example.output} onChange={(event) => patchExample(index, { output: event.target.value })} className={`${fieldClass()} font-mono`} /></label>
                <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">Explanation<input value={example.explanation ?? ""} onChange={(event) => patchExample(index, { explanation: event.target.value })} className={fieldClass()} /></label>
              </div>
            </div>
          ))}
        </section>

        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-gray-700/70 dark:bg-dark-card/95 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 px-1"><p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{selectedGroup ? `Clone to ${selectedGroup.name}` : "Choose destination group"}</p><p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{publishMode === "immediately" ? "Publishes after test generation" : launchDate ? `Scheduled for ${new Date(launchDate).toLocaleString()}` : "Launch date required"}</p></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => navigate("/teacher/assignments")} className={secondaryButtonClass}>Cancel</button><button disabled={submitting || !targetGroupId} className="btn-primary inline-flex items-center gap-2"><Copy size={15} /> {submitting ? "Cloning…" : "Clone assignment"}</button></div>
        </div>
      </form>
    </TeacherShell>
  );
}

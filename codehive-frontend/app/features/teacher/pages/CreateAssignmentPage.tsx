import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  BookOpen, Plus, ArrowLeft, ChevronRight, X, Check, Info,
} from "lucide-react";
import { CodeEditor } from "~/shared/components/CodeEditor";
import { sileo } from "sileo";
import { createAssignment, getActiveTeacherGroups } from "../api/assignment.api";
import type { AssignmentExample, Language, ComparatorType, TeacherGroup } from "../api/assignment.api";
import { TeacherShell } from "../components/TeacherShell";

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES: { value: Language; label: string; ext: string; monaco: string }[] = [
  { value: "PYTHON", label: "Python", ext: "py",   monaco: "python" },
  { value: "JAVA",   label: "Java",   ext: "java", monaco: "java"   },
  { value: "CPP",    label: "C++",    ext: "cpp",  monaco: "cpp"    },
  { value: "C",      label: "C",      ext: "c",    monaco: "c"      },
];

const LANGUAGE_TEMPLATES: Record<Language, string> = {
  PYTHON: "def solution():\n    pass\n",
  JAVA:   "class Solution {\n\n}\n",
  CPP:    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n",
  C:      "#include <stdio.h>\n\nint main(void) {\n  return 0;\n}\n",
};

const EXT_TO_LANG: Record<string, Language> = {
  py: "PYTHON", java: "JAVA", cpp: "CPP", cc: "CPP", c: "C",
};

const MAX_TITLE_CHARS = 200;
const MAX_TAGS = 10;
const MAX_TAG_CHARS = 50;
const MAX_SUPPORTING_TEXT_CHARS = 5_000;
const MAX_SOURCE_LINES = 500;
const MAX_SOURCE_BYTES = 256 * 1024;
const MAX_TEST_INPUT_BYTES = 1024 * 1024;
const MAX_TOTAL_TEST_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_EXAMPLES = 10;
const MAX_EXAMPLE_INPUT_OUTPUT_CHARS = 10_000;
const MAX_EXPLANATION_CHARS = 2_000;

type SolutionMode = "editor" | "file";
type TestCaseMode = "text" | "file";
type PublishMode = "immediately" | "scheduled";

interface TestCaseEntry {
  id: string; mode: TestCaseMode; text: string; file: File | null; isSample: boolean;
}

function uid() { return Math.random().toString(36).slice(2); }

function textToFile(content: string, name: string): File {
  return new File([content], name, { type: "text/plain" });
}

function codeToFile(code: string, ext: string): File {
  return new File([code], `solution.${ext}`, { type: "text/plain" });
}

function byteSize(value: string): number {
  return new Blob([value]).size;
}

function lineCount(value: string): number {
  return value ? value.split("\n").length : 0;
}

function CharacterCount({ value, max }: { value: string; max: number }) {
  return <p className="mt-1 text-right text-[11px] text-gray-600">{value.length.toLocaleString()} / {max.toLocaleString()}</p>;
}


// ─── Shared components ────────────────────────────────────────────────────────

function SectionCard({ number, title, badge, children }: {
  number: string; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-gray-800/60 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
        <span className="text-sm font-mono font-semibold text-gray-400 dark:text-gray-600">{number}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5 lg:p-6">{children}</div>
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {children}
    </label>
  );
}

function StyledInput({ id, value, onChange, placeholder, required, type = "text", min, max, step, maxLength }: {
  id?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string; min?: string; max?: string; step?: string; maxLength?: number;
}) {
  return (
    <input
      id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} min={min} max={max} step={step} maxLength={maxLength}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white
                 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                 focus:border-transparent transition-all text-sm"
    />
  );
}

function StyledSelect({ id, value, onChange, children }: {
  id?: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      id={id} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow focus:border-transparent
                 transition-all text-sm appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? "bg-azure text-white shadow-sm"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SliderField({ label, value, min, max, step, unit, accent, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; accent: "yellow" | "red"; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const pillClass = accent === "yellow"
    ? "bg-yellow/15 text-yellow"
    : "bg-red-400/15 text-red-400";
  const track = `linear-gradient(to right, ${accent === "yellow" ? "#FDC500" : "#f87171"} 0%, ${accent === "yellow" ? "#FDC500" : "#f87171"} ${pct}%, #374151 ${pct}%, #374151 100%)`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel>{label}</FieldLabel>
        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${pillClass}`}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full cursor-pointer appearance-none"
        style={{ background: track }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-600">{min} {unit}</span>
        <span className="text-[10px] text-gray-600">{max} {unit}</span>
      </div>
    </div>
  );
}

function UploadZone({ file, onFile, accept, hint }: {
  file: File | null; onFile: (f: File | null) => void; accept?: string; hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer
                 hover:border-azure/50 transition-colors"
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-azure/10 flex items-center justify-center">
            <BookOpen size={16} className="text-azure" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-xl bg-dark-surface flex items-center justify-center mx-auto mb-3">
            <Plus size={20} className="text-gray-500" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Drop a file or <span className="text-azure">browse</span></p>
          {hint && <p className="text-xs text-gray-600">{hint}</p>}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CreateAssignmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Form state ──
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [hints, setHints]             = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState("");

  const [referenceLanguage, setReferenceLanguage] = useState<Language>("PYTHON");
  const [groupId, setGroupId]                     = useState("");
  const [groups, setGroups]                       = useState<TeacherGroup[]>([]);
  const [groupsLoading, setGroupsLoading]         = useState(true);
  const [allowedLanguages, setAllowedLanguages]   = useState<Language[]>(["PYTHON", "JAVA", "CPP", "C"]);
  const [timeLimitMs, setTimeLimitMs]             = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb]         = useState(256);
  const [maxPoints, setMaxPoints]                 = useState(100);
  const [comparatorType, setComparatorType]       = useState<ComparatorType>("EXACT_MATCH");
  const [publishMode, setPublishMode]             = useState<PublishMode>("immediately");
  const [launchDate, setLaunchDate]               = useState("");
  const [dueDate, setDueDate]                     = useState("");
  const [closeDate, setCloseDate]                 = useState("");
  const [minimumDate]                             = useState(() => {
    const value = new Date();
    value.setMinutes(value.getMinutes() - value.getTimezoneOffset() + 1, 0, 0);
    return value.toISOString().slice(0, 16);
  });

  const [solutionMode, setSolutionMode] = useState<SolutionMode>("editor");
  const [solutionCode, setSolutionCode] = useState(LANGUAGE_TEMPLATES["PYTHON"]);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);

  const [testCases, setTestCases] = useState<TestCaseEntry[]>([
    { id: uid(), mode: "text", text: "", file: null, isSample: false },
  ]);
  const [examples, setExamples] = useState<AssignmentExample[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getActiveTeacherGroups()
      .then((items) => {
        if (cancelled) return;
        setGroups(items);
        const requestedGroup = searchParams.get("groupId");
        setGroupId(
          requestedGroup && items.some((group) => group.id === requestedGroup)
            ? requestedGroup
            : items[0]?.id ?? "",
        );
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load groups." });
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchParams]);

  // ── Tag helpers ──
  function addTag() {
    const t = tagInput.trim().toUpperCase();
    if (tags.length >= MAX_TAGS) {
      sileo.error({ title: `Use at most ${MAX_TAGS} tags.` });
      return;
    }
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  }

  // ── Language ──
  function handleRefLang(lang: Language) {
    setReferenceLanguage(lang);
    if (solutionMode === "editor") setSolutionCode(LANGUAGE_TEMPLATES[lang]);
  }
  function toggleLang(lang: Language) {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  // ── Solution file ──
  async function handleSolutionFile(file: File | null) {
    setSolutionFile(file);
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const detected = EXT_TO_LANG[ext];
    if (!detected) {
      setSolutionFile(null);
      sileo.error({ title: "Reference solution must be a .py, .java, .cpp, .cc, or .c file." });
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setSolutionFile(null);
      sileo.error({ title: "Reference solution must not exceed 256 KiB." });
      return;
    }
    if (lineCount(await file.text()) > MAX_SOURCE_LINES) {
      setSolutionFile(null);
      sileo.error({ title: "Reference solution must not exceed 500 lines." });
      return;
    }
    setReferenceLanguage(detected);
  }

  // ── Test cases ──
  function addTestCase() {
    if (testCases.length >= 50) {
      sileo.error({ title: "An assignment can have at most 50 test cases." });
      return;
    }
    setTestCases((p) => [...p, { id: uid(), mode: "text", text: "", file: null, isSample: false }]);
  }
  function removeTestCase(id: string) {
    setTestCases((p) => p.filter((tc) => tc.id !== id));
  }
  function patchTestCase(id: string, patch: Partial<TestCaseEntry>) {
    setTestCases((p) => p.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)));
  }

  function totalTestInputBytes(items: TestCaseEntry[]): number {
    return items.reduce((total, item) => total + (item.mode === "text" ? byteSize(item.text) : item.file?.size ?? 0), 0);
  }

  function updateSolutionCode(value: string) {
    if (lineCount(value) > MAX_SOURCE_LINES) {
      sileo.error({ title: "Reference solution must not exceed 500 lines." });
      return;
    }
    if (byteSize(value) > MAX_SOURCE_BYTES) {
      sileo.error({ title: "Reference solution must not exceed 256 KiB." });
      return;
    }
    setSolutionCode(value);
  }

  function updateTestCaseText(id: string, value: string) {
    if (byteSize(value) > MAX_TEST_INPUT_BYTES) {
      sileo.error({ title: "Each test input must not exceed 1 MiB." });
      return;
    }
    const current = testCases.find((item) => item.id === id);
    if (!current) return;
    const next = testCases.map((item) => item.id === id ? { ...item, text: value } : item);
    if (totalTestInputBytes(next) > MAX_TOTAL_TEST_INPUT_BYTES) {
      sileo.error({ title: "Combined test inputs must not exceed 5 MiB." });
      return;
    }
    patchTestCase(id, { text: value });
  }

  function handleTestCaseFile(id: string, file: File | null) {
    if (!file) {
      patchTestCase(id, { file: null });
      return;
    }
    if (file.size > MAX_TEST_INPUT_BYTES) {
      sileo.error({ title: "Each test input must not exceed 1 MiB." });
      return;
    }
    const next = testCases.map((item) => item.id === id ? { ...item, file } : item);
    if (totalTestInputBytes(next) > MAX_TOTAL_TEST_INPUT_BYTES) {
      sileo.error({ title: "Combined test inputs must not exceed 5 MiB." });
      return;
    }
    patchTestCase(id, { file });
  }

  function addExample() {
    if (examples.length >= MAX_EXAMPLES) {
      sileo.error({ title: `Use at most ${MAX_EXAMPLES} public examples.` });
      return;
    }
    setExamples((items) => [...items, { input: "", output: "", explanation: "" }]);
  }

  function patchExample(index: number, patch: Partial<AssignmentExample>) {
    setExamples((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (allowedLanguages.length === 0) {
      sileo.error({ title: "Select at least one allowed language." });
      return;
    }
    if (!groupId) {
      sileo.error({ title: "Select an active group." });
      return;
    }
    if (publishMode === "scheduled" && !launchDate) {
      sileo.error({ title: "Select a launch date for scheduled publishing." });
      return;
    }
    const launch = publishMode === "scheduled" ? new Date(launchDate).toISOString() : undefined;
    const due = dueDate ? new Date(dueDate).toISOString() : undefined;
    const close = closeDate ? new Date(closeDate).toISOString() : undefined;
    if ((launch && due && launch > due) || (due && close && due > close) || (launch && close && launch > close)) {
      sileo.error({ title: "Dates must satisfy launch ≤ due ≤ close." });
      return;
    }
    let resolvedSolution: File;
    if (solutionMode === "editor") {
      if (lineCount(solutionCode) > MAX_SOURCE_LINES || byteSize(solutionCode) > MAX_SOURCE_BYTES) {
        sileo.error({ title: "Reference solution exceeds source limits." });
        return;
      }
      const meta = LANGUAGES.find((l) => l.value === referenceLanguage)!;
      resolvedSolution = codeToFile(solutionCode, meta.ext);
    } else {
      if (!solutionFile) { sileo.error({ title: "Please upload a reference solution file." }); return; }
      resolvedSolution = solutionFile;
    }
    const testCaseFiles: File[] = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (tc.mode === "text") {
        if (!tc.text.trim()) { sileo.error({ title: `Test case ${i + 1} is empty.` }); return; }
        testCaseFiles.push(textToFile(tc.text, `testcase_${i + 1}.txt`));
      } else {
        if (!tc.file) { sileo.error({ title: `Test case ${i + 1} has no file.` }); return; }
        testCaseFiles.push(tc.file);
      }
    }
    if (totalTestInputBytes(testCases) > MAX_TOTAL_TEST_INPUT_BYTES) {
      sileo.error({ title: "Combined test inputs must not exceed 5 MiB." });
      return;
    }
    const normalizedExamples = examples.map((example) => ({
      input: example.input.trim(),
      output: example.output.trim(),
      explanation: example.explanation?.trim() ?? "",
    }));
    if (normalizedExamples.some((example) => !example.input || !example.output || !example.explanation)) {
      sileo.error({ title: "Every public example needs input, output, and an explanation." });
      return;
    }
    setIsSubmitting(true);
    try {
      await createAssignment(
        {
          groupId,
          title: title.trim(), description: description.trim(),
          constraints: constraints.split("\n").map((item) => item.trim()).filter(Boolean),
          hints: hints.split("\n").map((item) => item.trim()).filter(Boolean),
          tags,
          timeLimitMs, memoryLimitMb, comparatorType,
          allowedLanguages, referenceLanguage,
          launchDate: launch,
          dueDate: due,
          closeDate: close,
          examples: normalizedExamples,
          maxPoints,
          sampleFlags: testCases.map((tc) => tc.isSample),
        },
        resolvedSolution,
        testCaseFiles
      );
      sileo.success({ title: "Assignment created! Test generation in progress." });
      navigate("/teacher/assignments");
    } catch (err) {
      sileo.error({ title: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Live preview & checklist ──
  const hasTitleDesc  = title.trim().length > 0 && description.trim().length > 0;
  const hasLang       = allowedLanguages.length > 0;
  const hasSolution   = solutionMode === "editor" ? solutionCode.trim().length > 10 : solutionFile !== null;
  const hasTestCase   = testCases.some((tc) => tc.mode === "text" ? tc.text.trim().length > 0 : tc.file !== null);
  const hasDueDate    = dueDate.length > 0;
  const datesOutOfOrder = Boolean(
    (publishMode === "scheduled" && launchDate && dueDate && launchDate > dueDate)
    || (dueDate && closeDate && dueDate > closeDate)
    || (publishMode === "scheduled" && launchDate && closeDate && launchDate > closeDate),
  );

  const monacoLang    = LANGUAGES.find((l) => l.value === referenceLanguage)?.monaco ?? "python";

  const STEPS = ["Basics", "Config", "Solution", "Tests", "Examples"];

  return (
    <TeacherShell active="assignments" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments", to: "/teacher/assignments" }, { label: "Create" }]} contentClassName="max-w-5xl">
          <form onSubmit={handleSubmit} className="min-w-0">
            {/* Page header */}
            <div className="flex items-start gap-4 mb-8">
              <button type="button" onClick={() => navigate("/teacher")}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700
                           text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all flex-shrink-0 mt-1">
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-widest mb-1 uppercase">
                  New Assignment
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create assignment</h1>
              </div>
              {/* Stepper */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0 pt-2">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${i === 0 ? "text-azure" : "text-gray-600"}`}>
                        {i + 1}.
                      </span>
                      <span className={`text-xs font-medium ${i === 0 ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                        {step}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <span className="text-gray-700 text-xs">——</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-5">
              {/* ── 01 Basic information ── */}
              <SectionCard number="01" title="Basic information" badge="Required">
                <div className="space-y-5">
                  <div>
                    <FieldLabel htmlFor="title">Title</FieldLabel>
                    <StyledInput
                      id="title" value={title} onChange={setTitle}
                      placeholder="e.g. Topological Sort — Course Scheduler"
                      required maxLength={MAX_TITLE_CHARS}
                    />
                    <CharacterCount value={title} max={MAX_TITLE_CHARS} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <textarea
                      id="description" value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4} required maxLength={MAX_SUPPORTING_TEXT_CHARS}
                      placeholder="Given N courses and a list of prerequisites [a, b] meaning b must be taken before a..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm
                                 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-azure
                                 focus:border-transparent transition-all resize-none"
                    />
                    <CharacterCount value={description} max={MAX_SUPPORTING_TEXT_CHARS} />
                  </div>
                  <div>
                    <FieldLabel>Tags</FieldLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((t) => (
                        <span key={t}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-yellow/40 bg-yellow/5 text-yellow text-xs font-semibold">
                          {t}
                          <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))}
                            className="hover:text-white transition-colors">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text" value={tagInput}
                          onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                          placeholder="Add tag..." maxLength={MAX_TAG_CHARS}
                          className="w-24 bg-transparent text-xs text-yellow placeholder:text-gray-600
                                     focus:outline-none border-none"
                        />
                        {tagInput && (
                          <button type="button" onClick={addTag}
                            className="text-xs text-yellow hover:text-white transition-colors font-medium">
                            + add
                          </button>
                        )}
                      </div>
                    </div>
                    {tags.length === 0 && !tagInput && (
                      <button type="button" onClick={() => {}}
                        className="text-xs text-gray-500 hover:text-yellow transition-colors">
                        + Add tag
                      </button>
                    )}
                    <p className="mt-1 text-xs text-gray-600">{tags.length} / {MAX_TAGS} tags · {tagInput.length} / {MAX_TAG_CHARS} characters</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="constraints">Constraints <span className="text-gray-600 font-normal">(one per line)</span></FieldLabel>
                      <textarea id="constraints" rows={3} value={constraints} maxLength={MAX_SUPPORTING_TEXT_CHARS} onChange={(event) => setConstraints(event.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm resize-none" />
                      <CharacterCount value={constraints} max={MAX_SUPPORTING_TEXT_CHARS} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="hints">Hints <span className="text-gray-600 font-normal">(one per line)</span></FieldLabel>
                      <textarea id="hints" rows={3} value={hints} maxLength={MAX_SUPPORTING_TEXT_CHARS} onChange={(event) => setHints(event.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm resize-none" />
                      <CharacterCount value={hints} max={MAX_SUPPORTING_TEXT_CHARS} />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ── 02 Configuration ── */}
              <SectionCard number="02" title="Configuration" badge="Required">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Reference language */}
                  <div>
                    <FieldLabel htmlFor="refLang">Reference language</FieldLabel>
                    <div className="relative">
                      <StyledSelect id="refLang" value={referenceLanguage}
                        onChange={(v) => handleRefLang(v as Language)}>
                        {LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                      </StyledSelect>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Assign to group */}
                  <div>
                    <FieldLabel htmlFor="group">Assign to group</FieldLabel>
                    <div className="relative">
                      <StyledSelect id="group" value={groupId} onChange={setGroupId}>
                        <option value="">{groupsLoading ? "Loading groups…" : "— Select group"}</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </StyledSelect>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Output comparator */}
                  <div>
                    <FieldLabel htmlFor="comparator">Output comparator</FieldLabel>
                    <div className="relative">
                      <StyledSelect id="comparator" value={comparatorType}
                        onChange={(v) => setComparatorType(v as ComparatorType)}>
                        <option value="EXACT_MATCH">Exact match</option>
                        <option value="FLOATING_POINT">Floating point</option>
                      </StyledSelect>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Time limit */}
                  <SliderField
                    label="Time limit" value={timeLimitMs} min={500} max={10000} step={100}
                    unit="ms" accent="yellow" onChange={setTimeLimitMs}
                  />

                  {/* Memory limit */}
                  <SliderField
                    label="Memory limit" value={memoryLimitMb} min={64} max={1000} step={8}
                    unit="MB" accent="red" onChange={setMemoryLimitMb}
                  />

                  <div>
                    <FieldLabel htmlFor="maxPoints">Maximum points</FieldLabel>
                    <StyledInput id="maxPoints" type="number" min="0.01" max="9999999999.99" step="0.01" value={maxPoints} onChange={(value) => setMaxPoints(Number(value))} required />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>Publish assignment</FieldLabel>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button type="button" aria-pressed={publishMode === "immediately"}
                        onClick={() => { setPublishMode("immediately"); setLaunchDate(""); }}
                        className={`text-left rounded-xl border p-4 transition-colors ${publishMode === "immediately" ? "border-azure bg-azure/10" : "border-gray-700/50 hover:border-gray-600"}`}>
                        <span className={`block text-sm font-semibold ${publishMode === "immediately" ? "text-azure" : "text-gray-300"}`}>Publish immediately</span>
                        <span className="block mt-1 text-xs leading-relaxed text-gray-500">Students can see it as soon as test generation finishes.</span>
                      </button>
                      <button type="button" aria-pressed={publishMode === "scheduled"}
                        onClick={() => setPublishMode("scheduled")}
                        className={`text-left rounded-xl border p-4 transition-colors ${publishMode === "scheduled" ? "border-yellow bg-yellow/10" : "border-gray-700/50 hover:border-gray-600"}`}>
                        <span className={`block text-sm font-semibold ${publishMode === "scheduled" ? "text-yellow" : "text-gray-300"}`}>Schedule publish</span>
                        <span className="block mt-1 text-xs leading-relaxed text-gray-500">Keep it hidden until the launch date you choose.</span>
                      </button>
                    </div>
                  </div>

                  {publishMode === "scheduled" && (
                    <div>
                      <FieldLabel htmlFor="launchDate">Launch date</FieldLabel>
                      <StyledInput
                        id="launchDate" type="datetime-local" min={minimumDate} value={launchDate} onChange={setLaunchDate} required
                      />
                    </div>
                  )}

                  {/* Due date */}
                  <div>
                    <FieldLabel htmlFor="dueDate">Due date <span className="text-gray-600 font-normal">(optional)</span></FieldLabel>
                    <StyledInput
                      id="dueDate" type="datetime-local" min={(publishMode === "scheduled" && launchDate) || minimumDate} value={dueDate} onChange={setDueDate}
                    />
                  </div>

                  {/* Close date */}
                  <div>
                    <FieldLabel htmlFor="closeDate">Close date <span className="text-gray-600 font-normal">(optional)</span></FieldLabel>
                    <StyledInput
                      id="closeDate" type="datetime-local" min={dueDate || (publishMode === "scheduled" && launchDate) || minimumDate} value={closeDate} onChange={setCloseDate}
                    />
                  </div>
                </div>
                {datesOutOfOrder && <p className="mt-3 text-sm text-red-400">Dates must satisfy launch ≤ due ≤ close.</p>}

                {/* Allowed languages */}
                <div className="mt-5">
                  <FieldLabel>Allowed languages <span className="text-gray-600 font-normal">(students may submit in)</span></FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => {
                      const on = allowedLanguages.includes(lang.value);
                      return (
                        <button key={lang.value} type="button" onClick={() => toggleLang(lang.value)}
                          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                            on
                              ? "border-azure bg-azure/10 text-azure"
                              : "border-gray-700/50 text-gray-500 hover:border-gray-600 hover:text-gray-300"
                          }`}>
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>

              {/* ── 03 Reference Solution ── */}
              <SectionCard number="03" title="Reference solution" badge="Required">
                <div className="flex gap-2 mb-5">
                  <TabBtn active={solutionMode === "editor"} onClick={() => setSolutionMode("editor")}>
                    Write code
                  </TabBtn>
                  <TabBtn active={solutionMode === "file"} onClick={() => setSolutionMode("file")}>
                    Upload file
                  </TabBtn>
                </div>
                {solutionMode === "editor" ? (
                  <div className="rounded-xl overflow-hidden border border-gray-700/50">
                    <div className="flex items-center gap-2 px-4 py-2 bg-dark-surface border-b border-gray-700">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        solution.{LANGUAGES.find((l) => l.value === referenceLanguage)?.ext}
                      </span>
                    </div>
                    <div style={{ height: 320 }}>
                      <CodeEditor
                        height="100%" language={monacoLang}
                        value={solutionCode} onChange={updateSolutionCode}
                      />
                    </div>
                    <p className="px-4 py-2 text-right text-xs text-gray-500 border-t border-gray-700">{lineCount(solutionCode)} / {MAX_SOURCE_LINES} lines · {byteSize(solutionCode).toLocaleString()} / {MAX_SOURCE_BYTES.toLocaleString()} bytes</p>
                  </div>
                ) : (
                  <UploadZone
                    file={solutionFile} onFile={handleSolutionFile}
                    accept=".py,.java,.cpp,.cc,.c"
                    hint="Accepted: .py .java .cpp .cc .c · maximum 500 lines and 256 KiB"
                  />
                )}
              </SectionCard>

              {/* ── 04 Test Cases ── */}
              <SectionCard number="04" title="Test cases" badge="Required">
                <div className="space-y-4">
                  {testCases.map((tc, i) => (
                    <div key={tc.id}
                      className="border border-gray-700/50 rounded-xl overflow-hidden hover:border-azure/30 transition-colors">
                      <div className="flex items-center justify-between px-4 py-3 bg-dark-surface border-b border-gray-700/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">Test case {i + 1}</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={tc.isSample}
                              onChange={(e) => patchTestCase(tc.id, { isSample: e.target.checked })}
                              className="w-3.5 h-3.5 rounded accent-azure" />
                            <span className="text-xs text-gray-500">Sample (visible to students)</span>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <TabBtn active={tc.mode === "text"} onClick={() => patchTestCase(tc.id, { mode: "text" })}>
                              Type input
                            </TabBtn>
                            <TabBtn active={tc.mode === "file"} onClick={() => patchTestCase(tc.id, { mode: "file" })}>
                              Upload file
                            </TabBtn>
                          </div>
                          {testCases.length > 1 && (
                            <button type="button" onClick={() => removeTestCase(tc.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        {tc.mode === "text" ? (
                          <>
                            <textarea value={tc.text}
                              onChange={(e) => updateTestCaseText(tc.id, e.target.value)}
                              maxLength={MAX_TEST_INPUT_BYTES}
                              rows={3} placeholder="Enter the test case input (stdin)..."
                              className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface
                                         text-white font-mono text-sm placeholder:text-gray-600
                                         focus:outline-none focus:ring-2 focus:ring-azure focus:border-transparent
                                         transition-all resize-none"
                            />
                            <p className="mt-1 text-right text-[11px] text-gray-600">{byteSize(tc.text).toLocaleString()} / {MAX_TEST_INPUT_BYTES.toLocaleString()} bytes</p>
                          </>
                        ) : (
                          <UploadZone
                            file={tc.file} onFile={(f) => void handleTestCaseFile(tc.id, f)}
                            accept=".txt" hint="Plain text stdin · maximum 1 MiB per input, 5 MiB total"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addTestCase} disabled={testCases.length >= 50}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed
                               border-gray-700 text-gray-500 hover:border-azure/50 hover:text-azure
                               transition-all text-sm font-medium">
                    <Plus size={14} />
                    Add test case
                  </button>
                </div>
              </SectionCard>

              {/* ── 05 Public Examples ── */}
              <SectionCard number="05" title="Public examples" badge="Optional">
                <p className="text-sm text-gray-400 mb-4">Examples appear in assignment instructions. They are separate from private evaluator test cases.</p>
                <div className="space-y-4">
                  {examples.map((example, index) => (
                    <div key={index} className="border border-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-white">Example {index + 1}</span>
                        <button type="button" onClick={() => setExamples((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel htmlFor={`example-input-${index}`}>Input</FieldLabel>
                          <textarea id={`example-input-${index}`} required rows={3} value={example.input} maxLength={MAX_EXAMPLE_INPUT_OUTPUT_CHARS} onChange={(event) => patchExample(index, { input: event.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white font-mono text-sm resize-none" />
                          <CharacterCount value={example.input} max={MAX_EXAMPLE_INPUT_OUTPUT_CHARS} />
                        </div>
                        <div>
                          <FieldLabel htmlFor={`example-output-${index}`}>Output</FieldLabel>
                          <textarea id={`example-output-${index}`} required rows={3} value={example.output} maxLength={MAX_EXAMPLE_INPUT_OUTPUT_CHARS} onChange={(event) => patchExample(index, { output: event.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white font-mono text-sm resize-none" />
                          <CharacterCount value={example.output} max={MAX_EXAMPLE_INPUT_OUTPUT_CHARS} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <FieldLabel htmlFor={`example-explanation-${index}`}>Explanation</FieldLabel>
                        <textarea id={`example-explanation-${index}`} required rows={2} value={example.explanation ?? ""} maxLength={MAX_EXPLANATION_CHARS} onChange={(event) => patchExample(index, { explanation: event.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm resize-none" />
                        <CharacterCount value={example.explanation ?? ""} max={MAX_EXPLANATION_CHARS} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addExample} disabled={examples.length >= MAX_EXAMPLES} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-700 text-gray-500 hover:border-azure/50 hover:text-azure disabled:opacity-50 transition-all text-sm font-medium">
                    <Plus size={14} /> Add public example ({examples.length} / {MAX_EXAMPLES})
                  </button>
                </div>
              </SectionCard>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] rounded-2xl border border-gray-700/40 bg-dark-card p-5">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Readiness checklist</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <CheckItem done={hasTitleDesc} label="Title & description" />
                    <CheckItem done={hasLang} label="At least 1 language" />
                    <CheckItem done={hasSolution} label="Reference solution" />
                    <CheckItem done={hasTestCase} label="At least 1 test case" />
                    <CheckItem done={hasDueDate} label="Due date set" pending />
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-azure/20 bg-azure/5 p-4">
                  <Info size={17} className="text-azure flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Expected outputs are generated automatically</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">On creation, CodeHive runs reference solution against every private test input. Assignment becomes available after validation finishes.</p>
                  </div>
                </div>
              </section>

              {/* ── Submit ── */}
              <div className="flex justify-end gap-3 pb-8">
                <button type="button" onClick={() => navigate("/teacher")}
                  className="px-5 py-2.5 rounded-xl border border-gray-700/50 text-gray-300
                             hover:border-gray-600 hover:text-white transition-all text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-azure text-white text-sm
                             font-medium hover:bg-french transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating…
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Create assignment
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
    </TeacherShell>
  );
}

function CheckItem({ done, label, pending = false }: {
  done: boolean; label: string; pending?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        done
          ? "bg-green-500/20"
          : pending
          ? "bg-yellow/10"
          : "bg-gray-700/50"
      }`}>
        {done ? (
          <Check size={9} className="text-green-400" />
        ) : pending ? (
          <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        )}
      </div>
      <span className={`text-xs ${done ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
    </div>
  );
}

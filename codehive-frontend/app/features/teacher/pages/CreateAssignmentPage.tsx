import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CodeEditor } from "~/shared/components/CodeEditor";
import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { sileo } from "sileo";
import { createAssignment } from "../api/assignment.api";
import type { Language, ComparatorType } from "../api/assignment.api";
import { TEACHER_CREATE_NAV, TEACHER_CREATE_SIDEBAR_ITEMS } from "../config/dashboard.config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGES: { value: Language; label: string; ext: string; monaco: string }[] = [
  { value: "PYTHON", label: "Python", ext: "py", monaco: "python" },
  { value: "JAVA", label: "Java", ext: "java", monaco: "java" },
  { value: "CPP", label: "C++", ext: "cpp", monaco: "cpp" },
  { value: "C", label: "C", ext: "c", monaco: "c" },
];

const LANGUAGE_TEMPLATES: Record<Language, string> = {
  PYTHON: "def solution():\n    pass\n",
  JAVA: "class Solution {\n\n}\n",
  CPP: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n",
  C: "#include <stdio.h>\n\nint main(void) {\n  return 0;\n}\n",
};

const EXT_TO_LANG: Record<string, Language> = {
  py: "PYTHON",
  java: "JAVA",
  cpp: "CPP",
  cc: "CPP",
  c: "C",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SolutionMode = "editor" | "file";
type TestCaseMode = "text" | "file";

interface TestCaseEntry {
  id: string;
  mode: TestCaseMode;
  text: string;
  file: File | null;
  isSample: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Math.random().toString(36).slice(2);
}

function textToFile(content: string, name: string): File {
  return new File([content], name, { type: "text/plain" });
}

function codeToFile(code: string, language: Language, ext: string): File {
  return new File([code], `solution.${ext}`, { type: "text/plain" });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
        {badge && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20">
            <span className="text-xs font-medium text-azure dark:text-yellow">{badge}</span>
          </div>
        )}
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  id: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                 bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                 placeholder:text-gray-400 dark:placeholder:text-gray-500
                 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                 focus:border-transparent transition-all duration-200"
    />
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        active
          ? "bg-azure dark:bg-yellow text-white dark:text-imperial shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface"
      }`}
    >
      {children}
    </button>
  );
}

function UploadZone({
  file,
  onFile,
  accept,
  hint,
}: {
  file: File | null;
  onFile: (f: File) => void;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center
                 hover:border-azure/50 dark:hover:border-yellow/50 transition-colors cursor-pointer"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFile(dropped);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-azure/10 dark:bg-yellow/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-azure dark:text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFile(null as unknown as File); }}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-surface flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Drop a file here, or <span className="text-azure dark:text-yellow">browse</span>
          </p>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </>
      )}
    </div>
  );
}

function DynamicList({
  items,
  placeholder,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: string[];
  placeholder: string;
  onAdd: () => void;
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                       focus:border-transparent transition-all duration-200 text-sm"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400
                       hover:border-red-300 hover:text-red-500 dark:hover:border-red-700 transition-colors"
            aria-label="Remove item"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 text-sm text-azure dark:text-yellow font-medium
                   hover:opacity-80 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CreateAssignmentPage() {
  const navigate = useNavigate();

  // Basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [hints, setHints] = useState<string[]>([]);

  // Configuration
  const [referenceLanguage, setReferenceLanguage] = useState<Language>("PYTHON");
  const [allowedLanguages, setAllowedLanguages] = useState<Language[]>(["PYTHON", "JAVA", "CPP", "C"]);
  const [timeLimitMs, setTimeLimitMs] = useState("2000");
  const [memoryLimitMb, setMemoryLimitMb] = useState("256");
  const [comparatorType, setComparatorType] = useState<ComparatorType>("EXACT_MATCH");
  const [dueDate, setDueDate] = useState("");

  // Solution
  const [solutionMode, setSolutionMode] = useState<SolutionMode>("editor");
  const [solutionCode, setSolutionCode] = useState(LANGUAGE_TEMPLATES["PYTHON"]);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);

  // Test cases
  const [testCases, setTestCases] = useState<TestCaseEntry[]>([
    { id: uid(), mode: "text", text: "", file: null, isSample: false },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // When reference language changes, update editor template only if not edited
  function handleRefLanguageChange(lang: Language) {
    setReferenceLanguage(lang);
    if (solutionMode === "editor") {
      setSolutionCode(LANGUAGE_TEMPLATES[lang]);
    }
  }

  function toggleAllowedLanguage(lang: Language) {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  // Test case helpers
  function addTestCase() {
    setTestCases((prev) => [
      ...prev,
      { id: uid(), mode: "text", text: "", file: null, isSample: false },
    ]);
  }

  function removeTestCase(id: string) {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  }

  function updateTestCase(id: string, patch: Partial<TestCaseEntry>) {
    setTestCases((prev) => prev.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)));
  }

  // Solution file upload — try to auto-detect language from extension
  function handleSolutionFile(file: File) {
    setSolutionFile(file || null);
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const detected = EXT_TO_LANG[ext];
    if (detected) setReferenceLanguage(detected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (allowedLanguages.length === 0) {
      sileo.error({ title: "Select at least one allowed language." });
      return;
    }

    // Build the reference solution file
    let resolvedSolution: File;
    if (solutionMode === "editor") {
      const langMeta = LANGUAGES.find((l) => l.value === referenceLanguage)!;
      resolvedSolution = codeToFile(solutionCode, referenceLanguage, langMeta.ext);
    } else {
      if (!solutionFile) {
        sileo.error({ title: "Please upload a reference solution file." });
        return;
      }
      resolvedSolution = solutionFile;
    }

    // Build test case files
    const testCaseFiles: File[] = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (tc.mode === "text") {
        if (!tc.text.trim()) {
          sileo.error({ title: `Test case ${i + 1} is empty.` });
          return;
        }
        testCaseFiles.push(textToFile(tc.text, `testcase_${i + 1}.txt`));
      } else {
        if (!tc.file) {
          sileo.error({ title: `Test case ${i + 1} has no file uploaded.` });
          return;
        }
        testCaseFiles.push(tc.file);
      }
    }

    setIsSubmitting(true);
    try {
      await createAssignment(
        {
          title: title.trim(),
          description: description.trim(),
          constraints: constraints.filter(Boolean),
          hints: hints.filter(Boolean),
          tags: tags.filter(Boolean),
          timeLimitMs: Number(timeLimitMs),
          memoryLimitMb: Number(memoryLimitMb),
          comparatorType,
          allowedLanguages,
          referenceLanguage,
          dueDate: dueDate || undefined,
          sampleFlags: testCases.map((tc) => tc.isSample),
        },
        resolvedSolution,
        testCaseFiles
      );
      sileo.success({ title: "Assignment created! Test generation is in progress." });
      navigate("/teacher");
    } catch (err) {
      sileo.error({ title: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const monacoLang = LANGUAGES.find((l) => l.value === referenceLanguage)?.monaco ?? "python";

  return (
    <DashboardLayout
      logoLinkTo="/teacher"
      navLinks={TEACHER_CREATE_NAV}
      sidebarItems={TEACHER_CREATE_SIDEBAR_ITEMS}
    >
      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate("/teacher")}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400
                     hover:border-azure/50 dark:hover:border-yellow/50 hover:text-azure dark:hover:text-yellow transition-all duration-200"
          aria-label="Back to dashboard"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-1">
            <span className="text-xs font-medium text-azure dark:text-yellow">New Assignment</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Assignment</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ----------------------------------------------------------------- */}
        {/* Section 1 — Basic Information */}
        {/* ----------------------------------------------------------------- */}
        <SectionCard title="Basic Information" badge="Required">
          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <TextInput
                id="title"
                value={title}
                onChange={setTitle}
                placeholder="e.g. Binary Search Implementation"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="Describe the problem statement, what the student must implement, and the expected behavior."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                           focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            <div>
              <FieldLabel htmlFor="tags-0">Tags</FieldLabel>
              <DynamicList
                items={tags}
                placeholder="e.g. Arrays, Searching"
                onAdd={() => setTags((p) => [...p, ""])}
                onUpdate={(i, v) => setTags((p) => p.map((x, j) => (j === i ? v : x)))}
                onRemove={(i) => setTags((p) => p.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        </SectionCard>

        {/* ----------------------------------------------------------------- */}
        {/* Section 2 — Configuration */}
        {/* ----------------------------------------------------------------- */}
        <SectionCard title="Configuration" badge="Required">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Reference language */}
            <div>
              <FieldLabel htmlFor="refLang">Reference Language</FieldLabel>
              <select
                id="refLang"
                value={referenceLanguage}
                onChange={(e) => handleRefLanguageChange(e.target.value as Language)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                           focus:border-transparent transition-all duration-200"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Comparator */}
            <div>
              <FieldLabel htmlFor="comparator">Output Comparator</FieldLabel>
              <select
                id="comparator"
                value={comparatorType}
                onChange={(e) => setComparatorType(e.target.value as ComparatorType)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                           focus:border-transparent transition-all duration-200"
              >
                <option value="EXACT_MATCH">Exact Match</option>
                <option value="FLOATING_POINT">Floating Point</option>
              </select>
            </div>

            {/* Time limit */}
            <div>
              <FieldLabel htmlFor="timeLimit">Time Limit (ms)</FieldLabel>
              <TextInput
                id="timeLimit"
                type="number"
                value={timeLimitMs}
                onChange={setTimeLimitMs}
                placeholder="2000"
                required
              />
            </div>

            {/* Memory limit */}
            <div>
              <FieldLabel htmlFor="memLimit">Memory Limit (MB)</FieldLabel>
              <TextInput
                id="memLimit"
                type="number"
                value={memoryLimitMb}
                onChange={setMemoryLimitMb}
                placeholder="256"
                required
              />
            </div>

            {/* Due date */}
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="dueDate">Due Date (optional)</FieldLabel>
              <input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                           focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Allowed languages */}
            <div className="sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Allowed Languages <span className="text-gray-400">(students may submit in)</span>
              </span>
              <div className="flex flex-wrap gap-3">
                {LANGUAGES.map((lang) => {
                  const checked = allowedLanguages.includes(lang.value);
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => toggleAllowedLanguage(lang.value)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        checked
                          ? "border-azure dark:border-yellow bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-azure/50 dark:hover:border-yellow/50"
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ----------------------------------------------------------------- */}
        {/* Section 3 — Constraints & Hints */}
        {/* ----------------------------------------------------------------- */}
        <SectionCard title="Constraints & Hints" badge="Optional">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Constraints
              </span>
              <DynamicList
                items={constraints}
                placeholder="e.g. 1 ≤ n ≤ 10^5"
                onAdd={() => setConstraints((p) => [...p, ""])}
                onUpdate={(i, v) => setConstraints((p) => p.map((x, j) => (j === i ? v : x)))}
                onRemove={(i) => setConstraints((p) => p.filter((_, j) => j !== i))}
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Hints
              </span>
              <DynamicList
                items={hints}
                placeholder="e.g. Consider using a hash map"
                onAdd={() => setHints((p) => [...p, ""])}
                onUpdate={(i, v) => setHints((p) => p.map((x, j) => (j === i ? v : x)))}
                onRemove={(i) => setHints((p) => p.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        </SectionCard>

        {/* ----------------------------------------------------------------- */}
        {/* Section 4 — Reference Solution */}
        {/* ----------------------------------------------------------------- */}
        <SectionCard title="Reference Solution" badge="Required">
          <div className="flex gap-2 mb-5">
            <TabButton active={solutionMode === "editor"} onClick={() => setSolutionMode("editor")}>
              Write Code
            </TabButton>
            <TabButton active={solutionMode === "file"} onClick={() => setSolutionMode("file")}>
              Upload File
            </TabButton>
          </div>

          {solutionMode === "editor" ? (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Editor toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-dark-surface border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-gray-400 ml-2">
                  solution.{LANGUAGES.find((l) => l.value === referenceLanguage)?.ext}
                </span>
              </div>
              <div style={{ height: 400 }}>
                <CodeEditor
                  height="100%"
                  language={monacoLang}
                  value={solutionCode}
                  onChange={(v) => setSolutionCode(v)}
                />
              </div>
            </div>
          ) : (
            <UploadZone
              file={solutionFile}
              onFile={handleSolutionFile}
              accept=".py,.java,.cpp,.cc,.c"
              hint="Accepted: .py, .java, .cpp, .c — language is auto-detected from extension"
            />
          )}
        </SectionCard>

        {/* ----------------------------------------------------------------- */}
        {/* Section 5 — Test Cases */}
        {/* ----------------------------------------------------------------- */}
        <SectionCard title="Test Cases" badge="Required">
          <div className="space-y-4">
            {testCases.map((tc, index) => (
              <div
                key={tc.id}
                className="border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden
                           hover:border-azure/40 dark:hover:border-yellow/40 transition-colors"
              >
                {/* Test case header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Test Case {index + 1}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={tc.isSample}
                        onChange={(e) => updateTestCase(tc.id, { isSample: e.target.checked })}
                        className="w-4 h-4 rounded accent-azure dark:accent-yellow"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        Sample (visible to students)
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <TabButton
                        active={tc.mode === "text"}
                        onClick={() => updateTestCase(tc.id, { mode: "text" })}
                      >
                        Type Input
                      </TabButton>
                      <TabButton
                        active={tc.mode === "file"}
                        onClick={() => updateTestCase(tc.id, { mode: "file" })}
                      >
                        Upload File
                      </TabButton>
                    </div>

                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(tc.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label={`Remove test case ${index + 1}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Test case content */}
                <div className="p-4">
                  {tc.mode === "text" ? (
                    <textarea
                      value={tc.text}
                      onChange={(e) => updateTestCase(tc.id, { text: e.target.value })}
                      rows={3}
                      placeholder="Enter the test case input (stdin)..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                                 bg-white dark:bg-dark-surface text-gray-900 dark:text-white font-mono text-sm
                                 placeholder:text-gray-400 dark:placeholder:text-gray-500
                                 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                                 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  ) : (
                    <UploadZone
                      file={tc.file}
                      onFile={(f) => updateTestCase(tc.id, { file: f || null })}
                      accept=".txt"
                      hint="Plain text file — each line is read as stdin"
                    />
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addTestCase}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed
                         border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400
                         hover:border-azure/50 dark:hover:border-yellow/50 hover:text-azure dark:hover:text-yellow
                         transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Test Case
            </button>
          </div>
        </SectionCard>

        {/* ----------------------------------------------------------------- */}
        {/* Submit */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-8">
          <button
            type="button"
            onClick={() => navigate("/teacher")}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Assignment
              </>
            )}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

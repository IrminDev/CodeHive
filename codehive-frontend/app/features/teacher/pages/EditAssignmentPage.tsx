import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileCode2,
  FileInput,
  Info,
  LoaderCircle,
  Plus,
  Save,
  Settings2,
  Upload,
  X,
} from "lucide-react";
import { sileo } from "sileo";

import { CodeEditor } from "~/shared/components/CodeEditor";
import { CalendarInput } from "~/shared/components/ui/CalendarInput";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import {
  getTeacherAssignment,
  getTeacherAssignmentPreview,
  updateAssignment,
  updateAiPolicy,
} from "../api/assignment.api";
import type {
  AssignmentExample,
  ComparatorType,
  Language,
  TeacherAssignment,
  TestSuiteUpdateMode,
  UpdateAssignmentMetadata,
  AiPolicySettings,
} from "../types/assignment.types";
import { TeacherShell } from "../components/TeacherShell";
import { compactButtonClass, inputClass as teacherInputClass, panelClass, TeacherEmpty, TeacherLoading, TeacherPageHeader } from "../components/TeacherUI";
import { AiPolicyFields, normalizeAiPolicy, validAiPolicy } from "../components/AiPolicyFields";

const LANGUAGES: Array<{
  value: Language;
  label: string;
  ext: string;
  monaco: string;
}> = [
  { value: "PYTHON", label: "Python", ext: "py", monaco: "python" },
  { value: "JAVA", label: "Java", ext: "java", monaco: "java" },
  { value: "CPP", label: "C++", ext: "cpp", monaco: "cpp" },
  { value: "C", label: "C", ext: "c", monaco: "c" },
];
const EXT_TO_LANG: Record<string, Language> = {
  py: "PYTHON",
  java: "JAVA",
  cpp: "CPP",
  cc: "CPP",
  c: "C",
};
const MAX_TAGS = 10;
const MAX_TAG_CHARS = 50;
const MAX_SUPPORTING_TEXT_CHARS = 5_000;
const MAX_SOURCE_LINES = 500;
const MAX_SOURCE_BYTES = 256 * 1024;
const MAX_TEST_CASES = 50;
const MAX_TEST_INPUT_BYTES = 1024 * 1024;
const MAX_TOTAL_TEST_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_EXAMPLES = 10;
const MAX_EXAMPLE_INPUT_OUTPUT_CHARS = 10_000;
const MAX_EXPLANATION_CHARS = 2_000;
const inputClass = `${teacherInputClass} text-sm transition-colors`;
const sectionClass = `${panelClass} grid gap-5 p-5 sm:p-6`;
const primaryButtonClass = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-french focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-surface";
const secondaryButtonClass = `${compactButtonClass} min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow`;
const checkboxClass = "h-4 w-4 shrink-0 rounded border-gray-300 accent-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:accent-yellow dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-surface";

function EditSectionHeading({ icon, title, description, meta }: {
  icon: ReactNode; title: string; description?: string; meta?: string;
}) {
  return <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800/60">
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow" aria-hidden="true">{icon}</span>
      <div className="min-w-0"><h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </div>
    {meta && <span className="text-[10px] text-gray-500 dark:text-gray-400">{meta}</span>}
  </div>;
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toInstant(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

function lineCount(value: string): number {
  return value ? value.split("\n").length : 0;
}

function byteSize(value: string): number {
  return new Blob([value]).size;
}

function codeToFile(code: string, language: Language): File {
  const extension =
    LANGUAGES.find((item) => item.value === language)?.ext ?? "txt";
  return new File([code], `solution.${extension}`, { type: "text/plain" });
}

function inputToFile(input: string, order: number): File {
  return new File([input], `testcase_${order}.txt`, { type: "text/plain" });
}

interface EditableTestCase {
  id: string;
  order: number;
  input: string;
  sample: boolean;
  isNew: boolean;
}

function currentMinimumDate(): string {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset() + 1, 0, 0);
  return value.toISOString().slice(0, 16);
}

export function EditAssignmentPage({
  validationMode = false,
}: {
  validationMode?: boolean;
}) {
  const navigate = useNavigate();
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [hints, setHints] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [maxPoints, setMaxPoints] = useState(100);
  const [comparatorType, setComparatorType] =
    useState<ComparatorType>("EXACT_MATCH");
  const [allowedLanguages, setAllowedLanguages] = useState<Language[]>([]);
  const [referenceLanguage, setReferenceLanguage] =
    useState<Language>("PYTHON");
  const [originalReferenceLanguage, setOriginalReferenceLanguage] =
    useState<Language>("PYTHON");
  const [referenceSource, setReferenceSource] = useState("");
  const [originalReferenceSource, setOriginalReferenceSource] = useState("");
  const [testCases, setTestCases] = useState<EditableTestCase[]>([]);
  const [originalTestCases, setOriginalTestCases] = useState<
    EditableTestCase[]
  >([]);
  const [activeTestCaseCount, setActiveTestCaseCount] = useState<number | null>(
    null,
  );
  const [examples, setExamples] = useState<AssignmentExample[]>([]);
  const [launchDate, setLaunchDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [clearLaunchDate, setClearLaunchDate] = useState(false);
  const [clearDueDate, setClearDueDate] = useState(false);
  const [clearCloseDate, setClearCloseDate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiPolicy, setAiPolicy] = useState<AiPolicySettings>({
    aiAssistanceEnabled: false, maxAiRequests: 0, aiAssistanceLevel: "CONCEPTUAL_ONLY",
  });
  const [minimumDate] = useState(currentMinimumDate);
  const normalizedAiPolicy = normalizeAiPolicy(aiPolicy);
  const aiPolicyDirty = assignment !== null && (
    normalizedAiPolicy.aiAssistanceEnabled !== assignment.aiAssistanceEnabled
    || normalizedAiPolicy.maxAiRequests !== assignment.maxAiRequests
    || normalizedAiPolicy.aiAssistanceLevel !== assignment.aiAssistanceLevel
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      getTeacherAssignment(assignmentId),
      getTeacherAssignmentPreview(assignmentId),
    ])
      .then(([assignmentResult, previewResult]) => {
        if (cancelled) return;
        const item =
          previewResult.status === "fulfilled"
            ? previewResult.value.assignment
            : assignmentResult.status === "fulfilled"
              ? assignmentResult.value
              : null;
        if (!item) {
          throw assignmentResult.status === "rejected"
            ? assignmentResult.reason
            : new Error("Failed to load assignment.");
        }
        setAssignment(item);
        setAiPolicy({ aiAssistanceEnabled: item.aiAssistanceEnabled,
          maxAiRequests: item.maxAiRequests, aiAssistanceLevel: item.aiAssistanceLevel });
        setTitle(item.title);
        setDescription(item.description);
        setConstraints(item.constraints.join("\n"));
        setHints(item.hints.join("\n"));
        setTags(item.tags);
        setTimeLimitMs(item.timeLimitMs);
        setMemoryLimitMb(item.memoryLimitMb);
        setMaxPoints(item.maxPoints);
        setComparatorType(item.comparatorType);
        setAllowedLanguages(item.allowedLanguages);
        setExamples(item.examples ?? []);
        if (previewResult.status === "fulfilled") {
          setReferenceLanguage(previewResult.value.referenceLanguage);
          setOriginalReferenceLanguage(previewResult.value.referenceLanguage);
          setReferenceSource(previewResult.value.referenceSolution);
          setOriginalReferenceSource(previewResult.value.referenceSolution);
          const loadedTestCases = previewResult.value.testCases.map(
            (testCase) => ({
              id: `current-${testCase.order}`,
              order: testCase.order,
              input: testCase.input,
              sample: testCase.sample,
              isNew: false,
            }),
          );
          setTestCases(loadedTestCases);
          setOriginalTestCases(loadedTestCases);
          setActiveTestCaseCount(previewResult.value.testCases.length);
        }
      })
      .catch((error) => {
        if (!cancelled)
          sileo.error({
            title:
              error instanceof Error
                ? error.message
                : "Failed to load assignment.",
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  function addTag() {
    const tag = tagInput.trim().toUpperCase();
    if (!tag) return;
    if (tags.length >= MAX_TAGS) {
      sileo.error({ title: `Use at most ${MAX_TAGS} tags.` });
      return;
    }
    if (!tags.includes(tag)) setTags((items) => [...items, tag]);
    setTagInput("");
  }

  async function selectReferenceSolution(file: File | null) {
    if (!file) {
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const language = EXT_TO_LANG[extension];
    if (!language) {
      sileo.error({
        title:
          "Reference solution must be a .py, .java, .cpp, .cc, or .c file.",
      });
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      sileo.error({ title: "Reference solution must not exceed 256 KiB." });
      return;
    }
    const source = await file.text();
    if (lineCount(source) > MAX_SOURCE_LINES) {
      sileo.error({ title: "Reference solution must not exceed 500 lines." });
      return;
    }
    setReferenceLanguage(language);
    setReferenceSource(source);
  }

  function updateReferenceSource(value: string) {
    if (lineCount(value) > MAX_SOURCE_LINES) {
      sileo.error({ title: "Reference solution must not exceed 500 lines." });
      return;
    }
    if (byteSize(value) > MAX_SOURCE_BYTES) {
      sileo.error({ title: "Reference solution must not exceed 256 KiB." });
      return;
    }
    setReferenceSource(value);
  }

  function totalTestInputBytes(items: EditableTestCase[]): number {
    return items.reduce((total, item) => total + byteSize(item.input), 0);
  }

  function getTestSuiteChangeState(): {
    dirty: boolean;
    mode: TestSuiteUpdateMode;
  } {
    const existingChanged = originalTestCases.some((original) => {
      const current = testCases.find((item) => item.id === original.id);
      return (
        !current ||
        current.input !== original.input ||
        current.sample !== original.sample
      );
    });
    const hasRemovedExisting =
      originalTestCases.length !==
      testCases.filter((item) => !item.isNew).length;
    const hasNewTests = testCases.some((item) => item.isNew);
    const replace = existingChanged || hasRemovedExisting;
    return {
      dirty: replace || hasNewTests,
      mode: replace ? "REPLACE_ALL" : "APPEND",
    };
  }

  function updateTestCase(id: string, patch: Partial<EditableTestCase>) {
    const current = testCases.find((item) => item.id === id);
    if (!current) return;
    const next = testCases.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    );
    const changed = next.find((item) => item.id === id)!;
    if (byteSize(changed.input) > MAX_TEST_INPUT_BYTES) {
      sileo.error({ title: "Each test input must not exceed 1 MiB." });
      return;
    }
    if (totalTestInputBytes(next) > MAX_TOTAL_TEST_INPUT_BYTES) {
      sileo.error({ title: "Combined test inputs must not exceed 5 MiB." });
      return;
    }
    setTestCases(next);
  }

  function addTestCase() {
    if (testCases.length >= MAX_TEST_CASES) {
      sileo.error({ title: `Use at most ${MAX_TEST_CASES} test cases.` });
      return;
    }
    setTestCases((items) => [
      ...items,
      {
        id: `new-${crypto.randomUUID()}`,
        order: items.length + 1,
        input: "",
        sample: false,
        isNew: true,
      },
    ]);
  }

  function removeTestCase(id: string) {
    const current = testCases.find((item) => item.id === id);
    if (!current) return;
    setTestCases((items) => items.filter((item) => item.id !== id));
  }

  function toggleLanguage(language: Language) {
    setAllowedLanguages((items) =>
      items.includes(language)
        ? items.filter((item) => item !== language)
        : [...items, language],
    );
  }

  function addExample() {
    if (examples.length >= MAX_EXAMPLES) {
      sileo.error({ title: `Use at most ${MAX_EXAMPLES} public examples.` });
      return;
    }
    setExamples((items) => [
      ...items,
      { input: "", output: "", explanation: "" },
    ]);
  }

  function patchExample(index: number, patch: Partial<AssignmentExample>) {
    setExamples((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim() || !description.trim()) {
      sileo.error({ title: "Title and description are required." });
      return;
    }
    if (!allowedLanguages.length) {
      sileo.error({ title: "Select at least one allowed language." });
      return;
    }
    if (
      !Number.isFinite(timeLimitMs) ||
      timeLimitMs < 100 ||
      timeLimitMs > 10_000
    ) {
      sileo.error({ title: "Time limit must be between 100 and 10,000ms." });
      return;
    }
    if (
      !Number.isFinite(memoryLimitMb) ||
      memoryLimitMb < 16 ||
      memoryLimitMb > 1_000
    ) {
      sileo.error({ title: "Memory limit must be between 16 and 1,000MB." });
      return;
    }
    if (!Number.isFinite(maxPoints) || maxPoints < 0.01) {
      sileo.error({ title: "Maximum points must be at least 0.01." });
      return;
    }
    const { dirty: testSuiteDirty, mode: testSuiteUpdateMode } =
      getTestSuiteChangeState();
    if (
      testSuiteDirty &&
      testSuiteUpdateMode === "APPEND" &&
      activeTestCaseCount === null
    ) {
      sileo.error({
        title:
          "Could not verify active test count. Reload before appending inputs.",
      });
      return;
    }
    const sourceChanged =
      validationMode ||
      referenceSource !== originalReferenceSource ||
      referenceLanguage !== originalReferenceLanguage;
    if (sourceChanged && !referenceSource.trim()) {
      sileo.error({ title: "Reference solution cannot be empty." });
      return;
    }
    const testsForSubmission =
      validationMode || testSuiteUpdateMode === "REPLACE_ALL"
        ? testCases
        : testCases.filter((item) => item.isNew);
    const requiresSuiteValidation = validationMode || testSuiteDirty;
    if (requiresSuiteValidation && !testsForSubmission.length) {
      sileo.error({
        title: "A replacement suite must contain at least one test input.",
      });
      return;
    }
    if (
      requiresSuiteValidation &&
      testsForSubmission.some((item) => !item.input.trim())
    ) {
      sileo.error({ title: "Every test input must contain data." });
      return;
    }
    if (
      requiresSuiteValidation &&
      totalTestInputBytes(testCases) > MAX_TOTAL_TEST_INPUT_BYTES
    ) {
      sileo.error({ title: "Combined test inputs must not exceed 5 MiB." });
      return;
    }
    const launch = clearLaunchDate ? undefined : toInstant(launchDate);
    const due = clearDueDate ? undefined : toInstant(dueDate);
    const close = clearCloseDate ? undefined : toInstant(closeDate);
    const actualLaunch =
      launch ?? (clearLaunchDate ? undefined : assignment?.launchDate);
    const actualDue = due ?? (clearDueDate ? undefined : assignment?.dueDate);
    const actualClose =
      close ?? (clearCloseDate ? undefined : assignment?.closeDate);
    if (
      (actualLaunch && actualDue && actualLaunch > actualDue) ||
      (actualDue && actualClose && actualDue > actualClose) ||
      (actualLaunch && actualClose && actualLaunch > actualClose)
    ) {
      sileo.error({ title: "Dates must satisfy launch ≤ due ≤ close." });
      return;
    }
    const normalizedExamples = examples.map((example) => ({
      input: example.input.trim(),
      output: example.output.trim(),
      explanation: example.explanation?.trim() ?? "",
    }));
    if (
      normalizedExamples.some(
        (example) => !example.input || !example.output || !example.explanation,
      )
    ) {
      sileo.error({
        title: "Every public example needs input, output, and an explanation.",
      });
      return;
    }
    const metadata: UpdateAssignmentMetadata = {
      title: title.trim(),
      description: description.trim(),
      constraints: lines(constraints),
      hints: lines(hints),
      tags,
      timeLimitMs,
      memoryLimitMb,
      maxPoints,
      comparatorType,
      allowedLanguages,
      examples: normalizedExamples,
      ...(sourceChanged ? { referenceLanguage } : {}),
      ...(requiresSuiteValidation
        ? {
            sampleFlags: testsForSubmission.map((item) => item.sample),
            testSuiteUpdateMode: "REPLACE_ALL",
          }
        : {}),
      ...(clearLaunchDate
        ? { clearLaunchDate: true }
        : launch
          ? { launchDate: launch }
          : {}),
      ...(clearDueDate ? { clearDueDate: true } : due ? { dueDate: due } : {}),
      ...(clearCloseDate
        ? { clearCloseDate: true }
        : close
          ? { closeDate: close }
          : {}),
    };
    setSaving(true);
    try {
      if (aiPolicyDirty && !await saveAiPolicy()) return;
      const update = await updateAssignment(
        assignmentId,
        metadata,
        sourceChanged
          ? codeToFile(referenceSource, referenceLanguage)
          : undefined,
        requiresSuiteValidation
          ? testsForSubmission.map((item, index) =>
              inputToFile(item.input, index + 1),
            )
          : [],
      );
      sileo.success({
        title:
          update.status === "VALIDATING"
            ? "Update queued for validation."
            : "Assignment updated.",
      });
      navigate("/teacher/assignments");
    } catch (error) {
      sileo.error({
        title:
          error instanceof Error
            ? error.message
            : "Failed to update assignment.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveAiPolicy(): Promise<boolean> {
    if (!validAiPolicy(aiPolicy)) {
      sileo.error({ title: "AI answer quota must be a whole number from 1 to 10." });
      return false;
    }
    try {
      const saved = await updateAiPolicy(assignmentId, normalizeAiPolicy(aiPolicy));
      setAiPolicy(saved);
      setAssignment((current) => current ? { ...current, ...saved } : current);
      return true;
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to update AI policy." });
      return false;
    }
  }

  if (loading)
    return (
      <TeacherShell active="assignments" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments", to: "/teacher/assignments" }, { label: "Loading" }]}><TeacherLoading rows={6} /></TeacherShell>
    );
  if (!assignment)
    return (
      <TeacherShell active="assignments" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments" }]}><TeacherEmpty title="Assignment not found" description="Assignment was removed or is unavailable." /></TeacherShell>
    );

  const currentTests =
    activeTestCaseCount === null
      ? "Unavailable"
      : `${activeTestCaseCount} active`;
  const sourceChanged =
    validationMode ||
    referenceSource !== originalReferenceSource ||
    referenceLanguage !== originalReferenceLanguage;
  const { dirty: testSuiteDirty, mode: testSuiteUpdateMode } =
    getTestSuiteChangeState();
  const hasRevisionChanges = validationMode || sourceChanged || testSuiteDirty;
  const monacoLanguage =
    LANGUAGES.find((item) => item.value === referenceLanguage)?.monaco ??
    "plaintext";

  return (
    <TeacherShell active="assignments" contentClassName="max-w-5xl" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments", to: "/teacher/assignments" }, { label: assignment.title, to: `/teacher/assignments/${assignment.id}/preview` }, { label: validationMode ? "Update and validate" : "Edit" }]}>
      <Link to="/teacher/assignments" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-azure dark:text-gray-400 dark:hover:text-yellow"><ArrowLeft size={14} aria-hidden="true" /> Back to assignments</Link>
      <TeacherPageHeader eyebrow="Assignment management" title={validationMode ? "Update and validate assignment" : "Edit assignment"}
        description={validationMode ? "Code, private tests, constraints, and execution settings are applied after validation." : "Update student-facing details, examples, schedule, and AI assistance settings."} />
      <form onSubmit={submit} className="space-y-5 pb-8">

        <section className={sectionClass}>
          <EditSectionHeading icon={<BookOpen size={16} />} title="Assignment details" description="Title, description, and tags shown in student instructions." />
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
            <input
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
            <span className="text-right text-xs text-gray-500">
              {title.length} / 200
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
            <textarea
              required
              rows={6}
              maxLength={MAX_SUPPORTING_TEXT_CHARS}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputClass} resize-y`}
            />
            <span className="text-right text-xs text-gray-500">
              {description.length.toLocaleString()} /{" "}
              {MAX_SUPPORTING_TEXT_CHARS.toLocaleString()}
            </span>
          </label>
          {validationMode && (
            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Constraints <span className="text-gray-500">One per line</span>
                <textarea
                  rows={4}
                  maxLength={MAX_SUPPORTING_TEXT_CHARS}
                  value={constraints}
                  onChange={(event) => setConstraints(event.target.value)}
                  className={`${inputClass} resize-y`}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Hints <span className="text-gray-500">One per line</span>
                <textarea
                  rows={4}
                  maxLength={MAX_SUPPORTING_TEXT_CHARS}
                  value={hints}
                  onChange={(event) => setHints(event.target.value)}
                  className={`${inputClass} resize-y`}
                />
              </label>
            </div>
          )}
          <div className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Tags</span>
            <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-surface p-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-azure/10 px-2.5 py-1 text-xs font-medium text-azure dark:bg-yellow/10 dark:text-yellow"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setTags((items) => items.filter((item) => item !== tag))
                    }
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                aria-label="New tag"
                value={tagInput}
                maxLength={MAX_TAG_CHARS}
                onChange={(event) =>
                  setTagInput(event.target.value.toUpperCase())
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag…"
                className="min-w-28 flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <span className="text-xs text-gray-500">
              {tags.length} / {MAX_TAGS} tags · {tagInput.length} /{" "}
              {MAX_TAG_CHARS} characters
            </span>
          </div>
        </section>

        {validationMode && (
          <section className={sectionClass}>
            <EditSectionHeading icon={<Settings2 size={16} />} title="Configuration" description="Set execution limits, grading points, and supported languages." />
            <div className="grid md:grid-cols-4 gap-4">
              <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Time limit (ms)
                <input
                  required
                  type="number"
                  min={100}
                  max={10000}
                  value={timeLimitMs}
                  onChange={(event) =>
                    setTimeLimitMs(Number(event.target.value))
                  }
                  className={inputClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Memory limit (MB)
                <input
                  required
                  type="number"
                  min={16}
                  max={1000}
                  value={memoryLimitMb}
                  onChange={(event) =>
                    setMemoryLimitMb(Number(event.target.value))
                  }
                  className={inputClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Max points
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={maxPoints}
                  onChange={(event) => setMaxPoints(Number(event.target.value))}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Comparator
                <Dropdown ariaLabel="Output comparator" value={comparatorType} onChange={(value) => setComparatorType(value as ComparatorType)} options={[{ value: "EXACT_MATCH", label: "Exact match" }, { value: "FLOATING_POINT", label: "Floating point" }]} />
              </label>
            </div>
            <div>
              <p className="text-sm mb-2">Allowed languages</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((language) => {
                  const active = allowedLanguages.includes(language.value);
                  return (
                    <button
                      key={language.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleLanguage(language.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow ${active ? "border-azure/30 bg-azure/10 text-azure dark:border-yellow/30 dark:bg-yellow/10 dark:text-yellow" : "border-gray-200 text-gray-500 hover:border-azure/50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-yellow/40"}`}
                    >
                      {language.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {validationMode ? (
          <section className={sectionClass}>
            <EditSectionHeading icon={<FileCode2 size={16} />} title="Reference solution and tests" description="Saving rebuilds expected outputs from this complete suite. Validation must succeed before activation." />
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <FileCode2 size={17} className="text-azure dark:text-yellow" />
                  <h3 className="font-medium">Reference solution</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Dropdown ariaLabel="Reference language" value={referenceLanguage} onChange={(value) => setReferenceLanguage(value as Language)} options={LANGUAGES.map((language) => ({ value: language.value, label: language.label, description: `Main.${language.ext}` }))} size="compact" className="w-36" />
                  <label className={`${secondaryButtonClass} cursor-pointer focus-within:ring-2 focus-within:ring-azure dark:focus-within:ring-yellow`}>
                    <Upload size={15} />
                    Import file
                    <input
                      type="file"
                      className="sr-only"
                      accept=".py,.java,.cpp,.cc,.c"
                      onChange={(event) =>
                        void selectReferenceSolution(
                          event.target.files?.[0] ?? null,
                        )
                      }
                    />
                  </label>
                </div>
              </div>
              {originalReferenceSource ? (
                <>
                  <div className="h-96">
                    <CodeEditor
                      height="100%"
                      language={monacoLanguage}
                      value={referenceSource}
                      onChange={updateReferenceSource}
                    />
                  </div>
                  <p className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-right text-xs text-gray-500">
                    {lineCount(referenceSource)} / {MAX_SOURCE_LINES} lines ·{" "}
                    {byteSize(referenceSource).toLocaleString()} /{" "}
                    {MAX_SOURCE_BYTES.toLocaleString()} bytes
                  </p>
                </>
              ) : (
                <p className="p-5 text-sm text-gray-500">
                  Current source unavailable. Import a source file to create a
                  replacement revision.
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileInput size={17} className="text-azure dark:text-yellow" />
                    <h3 className="font-medium">Private test input editors</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Current suite: {currentTests}. Editing or removing existing
                    input switches update to replace suite.
                  </p>
                </div>
                {testSuiteDirty && (
                  <span className="rounded-md border border-azure/30 bg-azure/10 px-2 py-1 text-[10px] font-semibold text-azure dark:border-yellow/30 dark:bg-yellow/10 dark:text-yellow">
                    {testSuiteUpdateMode === "APPEND"
                      ? "New inputs will be appended"
                      : "Edited suite will replace active tests"}
                  </span>
                )}
              </div>
              {testCases.map((testCase, index) => (
                <div
                  key={testCase.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium">
                      Test input {index + 1}
                      {testCase.isNew && (
                        <span className="ml-2 text-xs text-azure dark:text-yellow">New</span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          className={checkboxClass}
                          checked={testCase.sample}
                          onChange={(event) =>
                            updateTestCase(testCase.id, {
                              sample: event.target.checked,
                            })
                          }
                        />
                        Sample
                      </label>
                      <button
                        type="button"
                        onClick={() => removeTestCase(testCase.id)}
                        className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <textarea
                    aria-label={`Test input ${index + 1}`}
                    required
                    rows={5}
                    maxLength={MAX_TEST_INPUT_BYTES}
                    value={testCase.input}
                    onChange={(event) =>
                      updateTestCase(testCase.id, { input: event.target.value })
                    }
                    placeholder="Program stdin…"
                    className={`${inputClass} rounded-none border-0 font-mono text-sm`}
                  />
                  <p className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-right text-xs text-gray-500">
                    {byteSize(testCase.input).toLocaleString()} /{" "}
                    {MAX_TEST_INPUT_BYTES.toLocaleString()} bytes
                  </p>
                </div>
              ))}
              <button
                type="button"
                disabled={testCases.length >= MAX_TEST_CASES}
                onClick={addTestCase}
                className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-xs font-medium text-gray-500 transition-colors hover:border-azure/60 hover:bg-azure/5 hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-yellow/40 dark:hover:bg-yellow/5 dark:hover:text-yellow dark:focus-visible:ring-yellow"
              >
                <Plus size={15} className="inline mr-2" />
                Add test input ({testCases.length} / {MAX_TEST_CASES})
              </button>
            </div>
            {hasRevisionChanges && (
              <div className="flex gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                <Info size={17} className="mt-0.5 shrink-0 text-orange-500" />
                <p>
                  This revision remains pending until worker validation
                  succeeds. Existing reference solution and test suite stay
                  active if validation fails.
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className={`${panelClass} flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6`}>
            <div>
              <h2 className="text-sm font-semibold">Validation suite</h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Update code, private test inputs, constraints, limits, or
                allowed languages in dedicated validation flow.
              </p>
            </div>
            <Link
              to={`/teacher/assignments/${assignment.id}/revalidate`}
              className={`${secondaryButtonClass} shrink-0 whitespace-nowrap`}
            >
              Update and validate
            </Link>
          </section>
        )}

        <section className={sectionClass}>
          <EditSectionHeading icon={<FileInput size={16} />} title="Public examples" description="Shown in student instructions; separate from private evaluator inputs." meta={`${examples.length} / ${MAX_EXAMPLES} examples`} />
          <div className="grid gap-4">
            {examples.map((example, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-center gap-3 mb-3">
                  <h3 className="font-medium text-sm">Example {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setExamples((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Input
                    <textarea
                      required
                      rows={4}
                      maxLength={MAX_EXAMPLE_INPUT_OUTPUT_CHARS}
                      value={example.input}
                      onChange={(event) =>
                        patchExample(index, { input: event.target.value })
                      }
                      className={`${inputClass} font-mono resize-y`}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expected output
                    <textarea
                      required
                      rows={4}
                      maxLength={MAX_EXAMPLE_INPUT_OUTPUT_CHARS}
                      value={example.output}
                      onChange={(event) =>
                        patchExample(index, { output: event.target.value })
                      }
                      className={`${inputClass} font-mono resize-y`}
                    />
                  </label>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Explanation
                  <textarea
                    required
                    rows={2}
                    maxLength={MAX_EXPLANATION_CHARS}
                    value={example.explanation ?? ""}
                    onChange={(event) =>
                      patchExample(index, { explanation: event.target.value })
                    }
                    className={`${inputClass} resize-y`}
                  />
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={examples.length >= MAX_EXAMPLES}
            onClick={addExample}
            className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-xs font-medium text-gray-500 transition-colors hover:border-azure/60 hover:bg-azure/5 hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-yellow/40 dark:hover:bg-yellow/5 dark:hover:text-yellow dark:focus-visible:ring-yellow"
          >
            <Plus size={15} className="inline mr-2" />
            Add public example ({examples.length} / {MAX_EXAMPLES})
          </button>
        </section>

        <section className={sectionClass}>
          <EditSectionHeading icon={<CalendarDays size={16} />} title="Reschedule" description="Leave empty to keep the current date. Clearing the due date marks existing late submissions on time." />
          <div className="grid md:grid-cols-3 gap-4">
            {[
              [
                "Launch",
                assignment.launchDate,
                launchDate,
                setLaunchDate,
                clearLaunchDate,
                setClearLaunchDate,
              ],
              [
                "Due",
                assignment.dueDate,
                dueDate,
                setDueDate,
                clearDueDate,
                setClearDueDate,
              ],
              [
                "Close",
                assignment.closeDate,
                closeDate,
                setCloseDate,
                clearCloseDate,
                setClearCloseDate,
              ],
            ].map(([label, current, value, setValue, clear, setClear]) => (
              <div key={label as string} className="grid gap-2">
                <label htmlFor={`assignment-${String(label).toLowerCase()}-date`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label as string}
                  <span className="block text-xs text-gray-500 mt-1">
                    Current:{" "}
                    {current
                      ? new Date(current as string).toLocaleString()
                      : "none"}
                  </span>
                </label>
                <CalendarInput
                  id={`assignment-${String(label).toLowerCase()}-date`}
                  type="datetime-local"
                  min={minimumDate}
                  disabled={clear as boolean}
                  value={value as string}
                  onChange={(next) => (setValue as React.Dispatch<React.SetStateAction<string>>)(next)}
                />
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    aria-label={`Clear ${String(label).toLowerCase()} date`}
                    className={checkboxClass}
                    checked={clear as boolean}
                    onChange={(event) =>
                      (
                        setClear as React.Dispatch<
                          React.SetStateAction<boolean>
                        >
                      )(event.target.checked)
                    }
                  />
                  Clear date
                </label>
              </div>
            ))}
          </div>
        </section>

        <AiPolicyFields value={aiPolicy} onChange={setAiPolicy} disabled={saving} footer={
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {aiPolicyDirty ? "Unsaved AI changes. " : "AI settings are saved. "}
            Use {validationMode ? "Validate and save" : "Save changes"} below to save all changes.
            AI settings take effect when saved, even if assignment changes require further validation.
          </p>
        } />

        <div className={`${panelClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5`}>
          <p className="text-xs text-gray-500 dark:text-gray-400">{validationMode ? "Your updated suite becomes active after successful validation." : "Save assignment details, examples, schedule, and AI settings."}</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/teacher/assignments")}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
              {saving
                ? "Saving…"
                : validationMode || hasRevisionChanges
                  ? "Validate and save"
                  : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </TeacherShell>
  );
}

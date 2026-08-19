import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  FileCode2,
  FileInput,
  Info,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { CodeEditor } from "~/shared/components/CodeEditor";
import {
  getTeacherAssignment,
  getTeacherAssignmentPreview,
  updateAssignment,
} from "../api/assignment.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type {
  AssignmentExample,
  ComparatorType,
  Language,
  TeacherAssignment,
  TestSuiteUpdateMode,
  UpdateAssignmentMetadata,
} from "../types/assignment.types";

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
const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-azure/40";

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
  const [minimumDate] = useState(currentMinimumDate);

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

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">
        Loading assignment…
      </div>
    );
  if (!assignment)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">
        Assignment not found.
      </div>
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
    <DashboardLayout
      logoLinkTo="/teacher"
      navLinks={TEACHER_NAV}
      sidebarItems={TEACHER_SIDEBAR_ITEMS}
    >
      <form onSubmit={submit} className="max-w-5xl mx-auto space-y-6 pb-8">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate("/teacher/assignments")}
            className="btn-outline p-2.5"
            aria-label="Back to assignments"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-azure dark:text-yellow">
              Assignment management
            </p>
            <h1 className="text-3xl font-bold mt-1">
              {validationMode
                ? "Update and validate assignment"
                : "Edit assignment"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {validationMode
                ? "Code, private tests, constraints, and execution settings are applied only after worker validation."
                : "Edit student-facing details, examples, and schedule without changing the validation suite."}
            </p>
          </div>
        </div>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-lg">Assignment details</h2>
            <span className="text-xs text-gray-500">
              Changes shown to students when saved
            </span>
          </div>
          <label className="grid gap-2 text-sm">
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
          <label className="grid gap-2 text-sm">
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
              <label className="grid gap-2 text-sm">
                Constraints <span className="text-gray-500">One per line</span>
                <textarea
                  rows={4}
                  maxLength={MAX_SUPPORTING_TEXT_CHARS}
                  value={constraints}
                  onChange={(event) => setConstraints(event.target.value)}
                  className={`${inputClass} resize-y`}
                />
              </label>
              <label className="grid gap-2 text-sm">
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
          <div className="grid gap-2 text-sm">
            <span>Tags</span>
            <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-surface p-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-azure/10 text-azure text-xs font-semibold"
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
          <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
            <h2 className="font-semibold text-lg">Configuration</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <label className="grid gap-2 text-sm">
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
              <label className="grid gap-2 text-sm">
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
              <label className="grid gap-2 text-sm">
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
              <label className="grid gap-2 text-sm">
                Comparator
                <select
                  value={comparatorType}
                  onChange={(event) =>
                    setComparatorType(event.target.value as ComparatorType)
                  }
                  className={inputClass}
                >
                  <option value="EXACT_MATCH">Exact match</option>
                  <option value="FLOATING_POINT">Floating point</option>
                </select>
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
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${active ? "border-azure bg-azure/10 text-azure" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-azure/50"}`}
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
          <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
            <div>
              <h2 className="font-semibold text-lg">
                Reference solution and tests
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Saving rebuilds expected outputs from this complete suite.
                Worker must validate it before activation.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <FileCode2 size={17} className="text-azure" />
                  <h3 className="font-medium">Reference solution</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={referenceLanguage}
                    onChange={(event) =>
                      setReferenceLanguage(event.target.value as Language)
                    }
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card px-3 py-1.5 text-sm"
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:border-azure/60">
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
                    <FileInput size={17} className="text-azure" />
                    <h3 className="font-medium">Private test input editors</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Current suite: {currentTests}. Editing or removing existing
                    input switches update to replace suite.
                  </p>
                </div>
                {testSuiteDirty && (
                  <span className="rounded-full border border-azure/30 bg-azure/10 px-3 py-1.5 text-xs font-semibold text-azure">
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
                        <span className="ml-2 text-xs text-azure">New</span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
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
                        className="text-sm text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <textarea
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
                className="w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-azure/60 hover:text-azure disabled:opacity-50"
              >
                <Plus size={15} className="inline mr-2" />
                Add test input ({testCases.length} / {MAX_TEST_CASES})
              </button>
            </div>
            {hasRevisionChanges && (
              <div className="flex gap-3 rounded-xl border border-yellow/30 bg-yellow/5 p-4 text-sm text-gray-600 dark:text-gray-300">
                <Info size={17} className="text-yellow flex-shrink-0 mt-0.5" />
                <p>
                  This revision remains pending until worker validation
                  succeeds. Existing reference solution and test suite stay
                  active if validation fails.
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-lg">Validation suite</h2>
              <p className="text-sm text-gray-500 mt-1">
                Update code, private test inputs, constraints, limits, or
                allowed languages in dedicated validation flow.
              </p>
            </div>
            <Link
              to={`/teacher/assignments/${assignment.id}/revalidate`}
              className="btn-primary whitespace-nowrap"
            >
              Update and validate
            </Link>
          </section>
        )}

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
          <div>
            <h2 className="font-semibold text-lg">Public examples</h2>
            <p className="text-sm text-gray-500 mt-1">
              Shown in student instructions; separate from private evaluator
              inputs.
            </p>
          </div>
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
                    className="text-sm text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-2 text-sm">
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
                  <label className="grid gap-2 text-sm">
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
                <label className="grid gap-2 text-sm mt-4">
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
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:border-azure/60 hover:text-azure disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <Plus size={15} className="inline mr-2" />
            Add public example ({examples.length} / {MAX_EXAMPLES})
          </button>
        </section>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
          <div>
            <h2 className="font-semibold text-lg">Reschedule</h2>
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to keep current date. Clearing due date marks existing
              late submissions on time.
            </p>
          </div>
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
                <label className="text-sm">
                  {label as string}
                  <span className="block text-xs text-gray-500 mt-1">
                    Current:{" "}
                    {current
                      ? new Date(current as string).toLocaleString()
                      : "none"}
                  </span>
                </label>
                <input
                  type="datetime-local"
                  min={minimumDate}
                  disabled={clear as boolean}
                  value={value as string}
                  onChange={(event) =>
                    (setValue as React.Dispatch<React.SetStateAction<string>>)(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
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

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/teacher/assignments")}
            className="btn-outline"
          >
            Cancel
          </button>
          <button disabled={saving} className="btn-primary">
            {saving
              ? "Saving…"
              : validationMode || hasRevisionChanges
                ? "Validate and save"
                : "Save changes"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

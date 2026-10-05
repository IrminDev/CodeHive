import type { ReactNode } from "react";
import {
  CalendarClock,
  Clock3,
  Cpu,
  Languages,
  Scale,
  Trophy,
} from "lucide-react";

export type AssignmentDetailsTab = "assignment" | "constraints" | "hints";

export interface AssignmentDetailsData {
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  maxPoints: number;
  comparatorType: string;
  allowedLanguages: string[];
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
  isActive: boolean;
  validationStatus?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
}

export function AssignmentDetailsPanel({
  assignment,
  tab,
  onTabChange,
  note,
}: {
  assignment: AssignmentDetailsData;
  tab: AssignmentDetailsTab;
  onTabChange: (tab: AssignmentDetailsTab) => void;
  note?: ReactNode;
}) {
  const tabs: Array<{ id: AssignmentDetailsTab; label: string }> = [
    { id: "assignment", label: "Assignment" },
    { id: "constraints", label: "Constraints" },
    { id: "hints", label: "Hints" },
  ];

  return (
    <section className="h-full min-h-0 flex flex-col bg-gray-50 dark:bg-dark-bg overflow-hidden">
      <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex-1 py-2.5 px-1 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === item.id
                ? "border-azure text-azure dark:border-yellow dark:text-yellow"
                : "border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4">
        {tab === "assignment" && <AssignmentSummary assignment={assignment} note={note} />}
        {tab === "constraints" && <ConstraintList items={assignment.constraints} />}
        {tab === "hints" && <HintList items={assignment.hints} />}
      </div>
    </section>
  );
}

function AssignmentSummary({ assignment, note }: { assignment: AssignmentDetailsData; note?: ReactNode }) {
  const examples = assignment.examples ?? [];
  const duePast = assignment.dueDate
    ? Date.parse(assignment.dueDate) < Date.now()
    : false;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
            assignment.isActive
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${assignment.isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {assignment.isActive ? "Active" : "Inactive"}
          </span>
          {assignment.validationStatus && (
            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
              {assignment.validationStatus}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-base font-bold leading-snug text-gray-900 dark:text-gray-100">
          {assignment.title}
        </h1>
        {assignment.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {assignment.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {assignment.description || "No assignment description provided."}
        </p>
      </div>

      <InfoSection title="Important dates" icon={<CalendarClock size={13} />}>
        <DateRow label="Launch" value={assignment.launchDate} fallback="Available immediately" />
        <DateRow label="Due" value={assignment.dueDate} fallback="No due date" warning={duePast} />
        <DateRow label="Close" value={assignment.closeDate} fallback="No close date" />
      </InfoSection>

      <InfoSection title="Evaluation" icon={<Scale size={13} />}>
        <div className="grid grid-cols-2 gap-2">
          <DetailCard icon={<Clock3 size={12} />} label="Time" value={`${assignment.timeLimitMs} ms`} />
          <DetailCard icon={<Cpu size={12} />} label="Memory" value={`${assignment.memoryLimitMb} MB`} />
          <DetailCard icon={<Trophy size={12} />} label="Points" value={String(assignment.maxPoints)} />
          <DetailCard icon={<Scale size={12} />} label="Comparator" value={formatComparator(assignment.comparatorType)} />
        </div>
        <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">
            <Languages size={12} /> Languages
          </p>
          <p className="mt-1 text-[11px] font-mono text-gray-700 dark:text-gray-300">
            {assignment.allowedLanguages.join(" · ") || "None"}
          </p>
        </div>
      </InfoSection>

      {examples.length > 0 && (
        <InfoSection title="Public examples">
          <div className="space-y-3">
            {examples.map((example, index) => (
              <article key={`${index}-${example.input}`} className="rounded-lg border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide border-b border-gray-200 dark:border-gray-800/60">
                  Example {index + 1}
                </p>
                <ExampleValue label="Input" value={example.input} />
                <ExampleValue label="Output" value={example.output} />
                {example.explanation && (
                  <p className="px-3 py-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800/60 whitespace-pre-wrap">
                    {example.explanation}
                  </p>
                )}
              </article>
            ))}
          </div>
        </InfoSection>
      )}

      {note && <div className="rounded-lg border border-yellow/30 bg-yellow/5 p-3">{note}</div>}
    </div>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function DateRow({ label, value, fallback, warning = false }: { label: string; value?: string; fallback: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b last:border-b-0 border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface px-3 py-2.5 first:rounded-t-lg last:rounded-b-lg">
      <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</span>
      <strong className={`text-right text-[11px] font-medium ${warning ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}>
        {value ? formatDate(value) : fallback}
      </strong>
    </div>
  );
}

function DetailCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface px-3 py-2.5 min-w-0">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-mono font-medium text-gray-700 dark:text-gray-300" title={value}>
        {value}
      </p>
    </div>
  );
}

function ExampleValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-800/60">
      <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[11px] font-mono text-gray-700 dark:text-gray-300">{value}</pre>
    </div>
  );
}

function ConstraintList({ items }: { items: string[] }) {
  if (!items.length) return <EmptyText>No constraints defined.</EmptyText>;
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-azure dark:bg-yellow flex-shrink-0" />
          <span className="font-mono whitespace-pre-wrap">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HintList({ items }: { items: string[] }) {
  if (!items.length) return <EmptyText>No hints available.</EmptyText>;
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-mono font-bold text-azure dark:text-yellow">{index + 1}.</span>
          <span className="whitespace-pre-wrap">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-xs text-gray-400 dark:text-gray-600">{children}</p>;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatComparator(value: string): string {
  return value === "EXACT_MATCH" ? "Exact match" : value.replaceAll("_", " ").toLowerCase();
}

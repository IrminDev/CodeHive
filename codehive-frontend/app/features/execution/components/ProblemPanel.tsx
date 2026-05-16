import React from "react";
import { Clock, Cpu, Scale } from "lucide-react";
import type { Assignment } from "../../student/types/assignment.types";
import { LANGUAGE_COLORS, LANGUAGE_LABELS } from "../config/execution.constants";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

export function LimitChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50">
      {icon}
      {label}
    </span>
  );
}

export function ProblemPanel({ assignment }: { assignment: Assignment }) {
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {assignment.isActive && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/40">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
              Active
            </span>
          )}
          {assignment.dueDate && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
              isOverdue
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700/50"
                : "bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/50"
            }`}>
              Due {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{assignment.title}</h1>
      </div>

      {/* Limits */}
      <div className="flex flex-wrap gap-3">
        <LimitChip icon={<Clock className="w-3.5 h-3.5" />} label={`${assignment.timeLimitMs ?? "—"}ms`} />
        <LimitChip icon={<Cpu className="w-3.5 h-3.5" />} label={`${assignment.memoryLimitMb ?? "—"}MB`} />
        {assignment.comparatorType && (
          <LimitChip icon={<Scale className="w-3.5 h-3.5" />} label={assignment.comparatorType === "EXACT_MATCH" ? "Exact Match" : "Floating Point"} />
        )}
      </div>

      {/* Description */}
      {assignment.description && (
        <Section title="Problem Statement">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
            {assignment.description}
          </p>
        </Section>
      )}

      {/* Constraints */}
      {assignment.constraints?.length > 0 && (
        <Section title="Constraints">
          <ul className="space-y-1.5">
            {assignment.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-azure dark:bg-yellow flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Hints */}
      {assignment.hints?.length > 0 && (
        <Section title="Hints">
          <ul className="space-y-1.5">
            {assignment.hints.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 italic">
                <span className="text-azure dark:text-yellow font-bold not-italic flex-shrink-0">{i + 1}.</span>
                {h}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Tags */}
      {assignment.tags?.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-2">
            {assignment.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {assignment.allowedLanguages?.length > 0 && (
        <Section title="Allowed Languages">
          <div className="flex flex-wrap gap-2">
            {assignment.allowedLanguages.map((lang) => (
              <span
                key={lang}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${LANGUAGE_COLORS[lang]}`}
              >
                {LANGUAGE_LABELS[lang]}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

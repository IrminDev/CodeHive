import { Link } from "react-router";
import type { Assignment } from "../types/assignment.types";

const LANGUAGE_LABELS: Record<string, string> = {
  PYTHON: "Python",
  JAVA: "Java",
  CPP: "C++",
  C: "C",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <Link
      to={`/assignment/${assignment.id}`}
      className="block bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 hover:border-azure/50 dark:hover:border-yellow/50 transition-all duration-500 hover:shadow-xl hover:shadow-azure/5 dark:hover:shadow-yellow/5 hover:-translate-y-1 relative overflow-hidden group"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-azure to-french opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Active badge */}
      {assignment.isActive && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-azure dark:bg-yellow animate-pulse" />
          <span className="text-xs font-medium text-azure dark:text-yellow">Active</span>
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-azure dark:group-hover:text-yellow transition-colors">
        {assignment.title}
      </h3>

      {assignment.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{assignment.description}</p>
      )}

      {/* Languages */}
      {assignment.allowedLanguages?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {assignment.allowedLanguages.map((lang) => (
            <span
              key={lang}
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50"
            >
              {LANGUAGE_LABELS[lang] ?? lang}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {assignment.timeLimitMs ? `${assignment.timeLimitMs}ms` : "—"}
        </span>
        {assignment.dueDate && (
          <span className={isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}>
            Due {formatDate(assignment.dueDate)}
          </span>
        )}
      </div>
    </Link>
  );
}

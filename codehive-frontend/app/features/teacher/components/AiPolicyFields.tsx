import { useId, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import { inputClass, panelClass } from "./TeacherUI";
import type { AiPolicySettings } from "../types/assignment.types";

const LEVELS: Array<{ value: AiPolicySettings["aiAssistanceLevel"]; label: string; detail: string }> = [
  { value: "CONCEPTUAL_ONLY", label: "Conceptual only", detail: "Concepts and terminology; no assignment-specific steps or code." },
  { value: "EXPLANATIONS_AND_GUIDING", label: "Explanations and guiding", detail: "Hints and guiding questions; no code or pseudocode." },
  { value: "EXPLANATIONS_GUIDING_AND_SNIPPETS", label: "Guiding with snippets", detail: "Short assignment-specific snippets allowed; never a complete solution." },
];

export function normalizeAiPolicy(policy: AiPolicySettings): AiPolicySettings {
  return { ...policy, maxAiRequests: policy.aiAssistanceEnabled ? policy.maxAiRequests : 0 };
}

export function validAiPolicy(policy: AiPolicySettings): boolean {
  return !policy.aiAssistanceEnabled || (Number.isInteger(policy.maxAiRequests)
    && policy.maxAiRequests >= 1 && policy.maxAiRequests <= 10);
}

export function AiPolicyFields({ value, onChange, footer, disabled = false }: {
  value: AiPolicySettings;
  onChange: (next: AiPolicySettings) => void;
  footer?: ReactNode;
  disabled?: boolean;
}) {
  const levelId = useId();
  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <div className="flex items-start gap-3 border-b border-gray-100 pb-4 dark:border-gray-800/60">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"><Sparkles size={16} aria-hidden="true" /></span>
        <div><h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI educational assistance</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Successful answers and educational redirections count toward each student's lifetime quota. Usage never resets.</p>
        </div>
      </div>
      <label className={`mt-5 flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors ${value.aiAssistanceEnabled ? "border-azure/30 bg-azure/5 text-azure dark:border-yellow/30 dark:bg-yellow/5 dark:text-yellow" : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-dark-card dark:text-gray-300"}`}>
        <input type="checkbox" disabled={disabled} checked={value.aiAssistanceEnabled} className="h-4 w-4 shrink-0 rounded border-gray-300 accent-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:accent-yellow dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-surface" onChange={(event) => onChange({
          ...value,
          aiAssistanceEnabled: event.target.checked,
          maxAiRequests: event.target.checked ? Math.max(1, value.maxAiRequests) : 0,
        })} />
        Enable assistant for this assignment
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Lifetime answers per student (1–10)
          <input type="number" min={value.aiAssistanceEnabled ? 1 : 0} max={value.aiAssistanceEnabled ? 10 : 0}
            required value={value.aiAssistanceEnabled ? value.maxAiRequests : 0}
            disabled={disabled || !value.aiAssistanceEnabled}
            onChange={(event) => onChange({ ...value, maxAiRequests: Number(event.target.value) })}
            className={`${inputClass} text-sm`} />
        </label>
        <div className="grid content-start gap-2">
          <label htmlFor={levelId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assistance level
          </label>
          <Dropdown id={levelId} ariaLabel="Assistance level" value={value.aiAssistanceLevel} disabled={disabled || !value.aiAssistanceEnabled}
            onChange={(next) => onChange({ ...value, aiAssistanceLevel: next as AiPolicySettings["aiAssistanceLevel"] })}
            options={LEVELS.map(level => ({ value: level.value, label: level.label }))} />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{LEVELS.find((level) => level.value === value.aiAssistanceLevel)?.detail}</p>
      {footer && <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800/60">{footer}</div>}
    </section>
  );
}

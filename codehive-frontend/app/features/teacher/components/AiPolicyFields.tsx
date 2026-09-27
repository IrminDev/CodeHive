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

export function AiPolicyFields({ value, onChange }: {
  value: AiPolicySettings;
  onChange: (next: AiPolicySettings) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-dark-card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI educational assistance</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Student-only help. Successful answers and educational redirections count toward lifetime quota; usage never resets.</p>
      <label className="mt-4 flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-200">
        <input type="checkbox" checked={value.aiAssistanceEnabled} onChange={(event) => onChange({
          ...value,
          aiAssistanceEnabled: event.target.checked,
          maxAiRequests: event.target.checked ? Math.max(1, value.maxAiRequests) : 0,
        })} />
        Enable assistant for this assignment
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-gray-800 dark:text-gray-200">
          Lifetime answers per student (1–10)
          <input type="number" min={value.aiAssistanceEnabled ? 1 : 0} max={value.aiAssistanceEnabled ? 10 : 0}
            required value={value.aiAssistanceEnabled ? value.maxAiRequests : 0}
            disabled={!value.aiAssistanceEnabled}
            onChange={(event) => onChange({ ...value, maxAiRequests: Number(event.target.value) })}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-dark-surface" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-gray-800 dark:text-gray-200">
          Assistance level
          <select value={value.aiAssistanceLevel} disabled={!value.aiAssistanceEnabled}
            onChange={(event) => onChange({ ...value, aiAssistanceLevel: event.target.value as AiPolicySettings["aiAssistanceLevel"] })}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-dark-surface">
            {LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{LEVELS.find((level) => level.value === value.aiAssistanceLevel)?.detail}</p>
    </section>
  );
}

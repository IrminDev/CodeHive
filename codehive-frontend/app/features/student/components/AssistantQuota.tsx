import type { AssistantAvailability } from "../types/assistant.types";

export function AssistantQuota({ availability }: { availability: AssistantAvailability }) {
  return <div className="text-xs text-gray-500 dark:text-gray-400" aria-label="AI answer quota">
    <span className="font-semibold text-gray-800 dark:text-gray-200">{availability.remaining} of {availability.maximum}</span> answers left
    {availability.reserved > 0 && <span> · {availability.reserved} pending</span>}
    <span className="block text-[11px]">Only delivered answers and educational redirections use quota. No resets.</span>
  </div>;
}

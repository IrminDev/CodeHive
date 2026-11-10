import { useId, type Ref } from "react";
import { Sparkles } from "lucide-react";

/** Header toggle for the docked assistant. Its ring and glow live in `.ai-trigger` (global.css). */
export function AssistantToggleButton({ open, busy, onToggle, ref }: { open: boolean; busy: boolean; onToggle: () => void; ref?: Ref<HTMLButtonElement> }) {
  const gradient = useId();
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      aria-controls="assignment-assistant"
      data-busy={busy}
      title={open ? "Collapse AI assistant" : "Open AI assistant"}
      className={`ai-trigger hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${open ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-ai-azure)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--color-ai-violet)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-ai-pink)" }} />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles size={14} stroke={`url(#${gradient})`} aria-hidden="true" />
      <span>Assistant</span>
      {busy && <span className="sr-only">(answering)</span>}
    </button>
  );
}

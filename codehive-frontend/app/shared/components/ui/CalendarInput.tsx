import { useRef } from "react";
import { CalendarDays, Clock3, X } from "lucide-react";

import { cn } from "~/shared/lib/utils";

interface CalendarInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "datetime-local";
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  size?: "default" | "compact";
  clearable?: boolean;
}

export function CalendarInput({
  value,
  onChange,
  type = "date",
  id,
  name,
  min,
  max,
  required,
  disabled,
  ariaLabel,
  className,
  size = "default",
  clearable = !required,
}: CalendarInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = type === "datetime-local" ? Clock3 : CalendarDays;

  function openPicker() {
    if (disabled) return;
    inputRef.current?.focus();
    try {
      inputRef.current?.showPicker();
    } catch {
      // Focus still exposes keyboard-accessible native date controls.
    }
  }

  return (
    <div className={cn("group relative", className)}>
      <Icon
        size={size === "compact" ? 14 : 16}
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-azure transition-colors group-focus-within:text-french dark:text-yellow"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        value={value}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white pl-10 pr-16 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-azure disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/60 dark:bg-dark-card dark:text-gray-100 dark:hover:border-gray-600 dark:focus:ring-yellow [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0",
          size === "compact" ? "min-h-9 rounded-lg py-2 text-xs" : "min-h-11 py-2.5",
          !clearable && "pr-10",
        )}
      />
      {clearable && value && !disabled && (
        <button type="button" onClick={() => onChange("")} className="absolute right-9 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500" aria-label="Clear date">
          <X size={13} />
        </button>
      )}
      <button type="button" onClick={openPicker} disabled={disabled} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-azure/10 hover:text-azure focus:outline-none focus:ring-2 focus:ring-azure dark:hover:bg-yellow/10 dark:hover:text-yellow dark:focus:ring-yellow" aria-label="Open calendar">
        <CalendarDays size={15} />
      </button>
    </div>
  );
}

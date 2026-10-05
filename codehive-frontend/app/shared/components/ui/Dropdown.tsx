import type { ReactNode } from "react";

import { cn } from "~/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

const EMPTY_VALUE = "__codehive_empty_value__";

export interface DropdownOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  value: string | number;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  size?: "default" | "compact";
}

function encodeValue(value: string | number): string {
  const normalized = String(value);
  return normalized === "" ? EMPTY_VALUE : normalized;
}

function decodeValue(value: string): string {
  return value === EMPTY_VALUE ? "" : value;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  id,
  name,
  required,
  disabled,
  ariaLabel,
  className,
  contentClassName,
  size = "default",
}: DropdownProps) {
  const hasEmptyOption = options.some((option) => String(option.value) === "");
  const selectedValue = String(value) === "" && !hasEmptyOption ? undefined : encodeValue(value);

  return (
    <Select
      value={selectedValue}
      onValueChange={(next) => onChange(decodeValue(next))}
      name={name}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(size === "compact" && "min-h-9 rounded-lg px-2.5 py-2 text-xs", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem key={encodeValue(option.value)} value={encodeValue(option.value)} disabled={option.disabled}>
            <span className="flex min-w-0 items-center gap-2.5">
              {option.icon && <span className="shrink-0 text-gray-400">{option.icon}</span>}
              <span className="min-w-0">
                <span className="block truncate font-medium">{option.label}</span>
                {option.description && <span className="mt-0.5 block truncate text-[11px] font-normal text-gray-500 dark:text-gray-400">{option.description}</span>}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

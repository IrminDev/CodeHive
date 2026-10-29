import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";

/**
 * Returns to the page the user came from. When the page was opened directly
 * (no in-app history), it links to `fallback` and says so.
 */
export function BackLink({ fallback, fallbackLabel, className = "" }: {
  fallback: string;
  fallbackLabel: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const hasHistory = useLocation().key !== "default";
  return (
    <Link
      to={fallback}
      onClick={(event) => {
        if (!hasHistory || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        navigate(-1);
      }}
      className={`inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-500 transition-colors hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-400 dark:hover:text-yellow dark:focus-visible:ring-yellow ${className}`}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      {hasHistory ? "Back" : fallbackLabel}
    </Link>
  );
}

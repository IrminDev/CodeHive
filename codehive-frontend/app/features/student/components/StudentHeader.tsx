import { Bell, ChevronRight, LogOut, Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router";

import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";

export interface StudentBreadcrumb {
  label: string;
  to?: string;
}

export function StudentHeader({ breadcrumbs }: { breadcrumbs: StudentBreadcrumb[] }) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-12 flex-shrink-0 flex items-center gap-4 px-5 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800/60">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0 flex-shrink-0">
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
            {index > 0 && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
            {item.to ? (
              <Link to={item.to} className="truncate text-gray-400 dark:text-gray-500 hover:text-azure dark:hover:text-yellow transition-colors">{item.label}</Link>
            ) : (
              <span className={`truncate ${index === breadcrumbs.length - 1 ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-400 dark:text-gray-500"}`}>{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="hidden sm:block flex-1 max-w-sm mx-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700/60">
          <Search size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input type="text" placeholder="Search assignments, groups..." className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none" />
          <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono border border-gray-200 dark:border-gray-700 rounded px-1 flex-shrink-0">⌘K</span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        <button className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" aria-label="Notifications"><Bell size={18} /></button>
        <button onClick={toggleTheme} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={logout} className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" aria-label="Log out" title="Log out"><LogOut size={18} /></button>
      </div>
    </header>
  );
}

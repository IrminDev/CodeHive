import { Bell, ChevronRight, LogOut, Moon, Settings, Sun } from "lucide-react";
import { Link } from "react-router";

import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { Scope } from "~/shared/types/model/User";

export interface StudentBreadcrumb {
  label: string;
  to?: string;
}

export function StudentHeader({ breadcrumbs }: { breadcrumbs: StudentBreadcrumb[] }) {
  const { user, logout } = useAuth();
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

      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        {user?.scopes?.includes(Scope.CREATE_GROUP) && (
          <Link to="/teacher" className="text-gray-400 dark:text-gray-500 hover:text-azure dark:hover:text-yellow transition-colors" aria-label="Manage groups" title="Manage groups"><Settings size={18} /></Link>
        )}
        <Link to="/notifications" className="text-gray-400 dark:text-gray-500 hover:text-azure dark:hover:text-yellow transition-colors" aria-label="Notification settings" title="Notification settings"><Bell size={18} /></Link>
        <button onClick={toggleTheme} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={logout} className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" aria-label="Log out" title="Log out"><LogOut size={18} /></button>
      </div>
    </header>
  );
}

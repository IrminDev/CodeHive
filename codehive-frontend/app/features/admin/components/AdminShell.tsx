import { useState, type ReactNode } from "react";
import { Activity, ChevronRight, Gauge, LogOut, Moon, ShieldCheck, Sun, Users } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { ProfileSettingsModal } from "~/shared/components/ProfileSettingsModal";
import { Scope } from "~/shared/types/model/User";
import { hasAnyEffectiveScope, hasEffectiveScope } from "../utils/permissions";

export type AdminNavigation = "overview" | "users" | "incidents" | "audit";
export interface AdminBreadcrumb { label: string; to?: string }

export function AdminShell({ active, breadcrumbs, children, contentClassName = "max-w-7xl" }: {
  active: AdminNavigation;
  breadcrumbs: AdminBreadcrumb[];
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <AdminSidebar active={active} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
          <div className={`${contentClassName} mx-auto pb-8`}>{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminHeader({ breadcrumbs }: { breadcrumbs: AdminBreadcrumb[] }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = `${user?.name?.charAt(0) ?? "A"}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase();
  return (
    <>
      <header className="h-12 flex-shrink-0 flex items-center gap-3 px-3 sm:px-5 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800/60">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
              {item.to ? <Link to={item.to} className="truncate text-gray-400 dark:text-gray-500 hover:text-azure dark:hover:text-yellow">{item.label}</Link>
                : <span className={`truncate ${index === breadcrumbs.length - 1 ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>{item.label}</span>}
            </span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button onClick={toggleTheme} className="w-9 h-9 grid place-items-center rounded-lg text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-card" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setProfileOpen(true)} className="w-8 h-8 rounded-full bg-azure text-white text-[10px] font-bold grid place-items-center focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow" aria-label="Open profile settings" title={user?.name}>{initials}</button>
          <button onClick={logout} className="w-9 h-9 grid place-items-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/5" aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </header>
      <ProfileSettingsModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

function AdminSidebar({ active }: { active: AdminNavigation }) {
  const { user } = useAuth();
  const showUsers = hasAnyEffectiveScope(user, [Scope.VIEW_USERS, Scope.CREATE_USERS, Scope.CREATE_ADMINS]);
  const links = [
    { key: "overview" as const, label: "Overview", to: "/admin", icon: <Gauge size={20} />, show: true },
    { key: "users" as const, label: "Users", to: "/admin/users", icon: <Users size={20} />, show: showUsers },
    { key: "incidents" as const, label: "Rate-limit incidents", to: "/admin/incidents", icon: <Activity size={20} />, show: hasEffectiveScope(user, Scope.VIEW_USERS) },
    { key: "audit" as const, label: "Audit history", to: "/admin/audit", icon: <ShieldCheck size={20} />, show: hasEffectiveScope(user, Scope.VIEW_AUDIT_LOG) },
  ];
  return (
    <aside className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 bg-gray-50 dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800/60">
      <Link to="/admin" className="mb-4" aria-label="Admin dashboard">
        <div style={{ clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} className="w-9 h-9 bg-yellow grid place-items-center"><span className="text-dark-bg font-bold text-sm">&lt;/&gt;</span></div>
      </Link>
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2" aria-label="Admin navigation">
        {links.filter((item) => item.show).map((item) => (
          <Link key={item.key} to={item.to} title={item.label} aria-current={active === item.key ? "page" : undefined}
            className={`w-10 h-10 grid place-items-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow ${active === item.key ? "text-yellow bg-yellow/10" : "text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card"}`}>
            {item.icon}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

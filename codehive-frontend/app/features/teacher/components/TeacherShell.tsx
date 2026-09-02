import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Home,
  LogOut,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { ProfileSettingsModal } from "~/shared/components/ProfileSettingsModal";

export type TeacherNavigation =
  | "dashboard"
  | "assignments"
  | "groups"
  | "grades"
  | "analytics"
  | "notifications";

export interface TeacherBreadcrumb {
  label: string;
  to?: string;
}

export function TeacherShell({
  active,
  breadcrumbs,
  children,
  contentClassName = "max-w-6xl",
}: {
  active: TeacherNavigation;
  breadcrumbs: TeacherBreadcrumb[];
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <TeacherSidebar active={active} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TeacherHeader breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
          <div className={`${contentClassName} mx-auto pb-8`}>{children}</div>
        </main>
      </div>
    </div>
  );
}

function TeacherHeader({ breadcrumbs }: { breadcrumbs: TeacherBreadcrumb[] }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = `${user?.name?.charAt(0) ?? "T"}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <>
      <header className="h-12 flex-shrink-0 flex items-center gap-3 px-3 sm:px-5 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800/60">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
              {item.to ? (
                <Link to={item.to} className="truncate text-gray-400 dark:text-gray-500 hover:text-azure dark:hover:text-yellow transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={`truncate ${index === breadcrumbs.length - 1 ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
          <HeaderLink to="/teacher/notifications" label="Notification settings"><Bell size={18} /></HeaderLink>
          <button onClick={toggleTheme} className="w-9 h-9 grid place-items-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setProfileOpen(true)} title={user?.name} className="w-8 h-8 rounded-full bg-azure text-white text-[10px] font-bold grid place-items-center focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow focus:ring-offset-2 dark:focus:ring-offset-dark-surface">
            {initials}
          </button>
          <button onClick={logout} className="w-9 h-9 grid place-items-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/5 transition-colors" aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <ProfileSettingsModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

function TeacherSidebar({ active }: { active: TeacherNavigation }) {
  return (
    <aside className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 bg-gray-50 dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800/60">
      <Link to="/teacher" className="mb-4 flex-shrink-0" aria-label="Teacher dashboard">
        <div style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} className="w-9 h-9 bg-yellow grid place-items-center">
          <span className="text-dark-bg font-bold text-sm leading-none">&lt;/&gt;</span>
        </div>
      </Link>
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2" aria-label="Teacher navigation">
        <SidebarLink icon={<Home size={20} />} label="Dashboard" to="/teacher" active={active === "dashboard"} />
        <SidebarLink icon={<BookOpen size={20} />} label="Assignments" to="/teacher/assignments" active={active === "assignments"} />
        <SidebarLink icon={<Users size={20} />} label="Groups" to="/teacher/groups" active={active === "groups"} />
        <SidebarLink icon={<GraduationCap size={20} />} label="Grades" to="/teacher/grades" active={active === "grades"} />
        <SidebarLink icon={<BarChart3 size={20} />} label="Analytics" to="/teacher/analytics" active={active === "analytics"} />
      </nav>
    </aside>
  );
}

function HeaderLink({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return <Link to={to} aria-label={label} title={label} className="w-9 h-9 grid place-items-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-azure dark:hover:text-yellow hover:bg-gray-100 dark:hover:bg-dark-card transition-colors">{children}</Link>;
}

function SidebarLink({ icon, label, to, active }: { icon: ReactNode; label: string; to: string; active: boolean }) {
  return <Link to={to} title={label} aria-current={active ? "page" : undefined} className={`w-10 h-10 grid place-items-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow ${active ? "text-yellow bg-yellow/10" : "text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card"}`}>{icon}</Link>;
}

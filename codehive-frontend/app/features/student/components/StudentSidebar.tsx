import { BookOpen, ClipboardList, GraduationCap, Home, Users } from "lucide-react";
import { Link } from "react-router";
import type { ReactNode } from "react";

import { useAuth } from "~/core/providers/AuthProvider";

export type StudentNavigation = "dashboard" | "groups" | "join" | "assignments" | "grades" | "notifications";

export function StudentSidebar({ active }: { active: StudentNavigation }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "ST";

  return (
    <aside className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 bg-gray-50 dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800/60">
      <Link to="/dashboard" className="mb-4 flex-shrink-0" aria-label="Dashboard">
        <div style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} className="w-9 h-9 bg-yellow flex items-center justify-center">
          <span className="text-dark-bg font-bold text-sm leading-none">&lt;/&gt;</span>
        </div>
      </Link>
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2" aria-label="Student navigation">
        <SidebarLink icon={<Home size={20} />} label="Dashboard" to="/dashboard" active={active === "dashboard"} />
        <SidebarLink icon={<BookOpen size={20} />} label="My groups" to="/groups" active={active === "groups"} />
        <SidebarLink icon={<Users size={20} />} label="Join group" to="/groups/join" active={active === "join"} />
        <SidebarLink icon={<ClipboardList size={20} />} label="Assignments" to="/assignments" active={active === "assignments"} />
        <SidebarLink icon={<GraduationCap size={20} />} label="Grades" to="/grades" active={active === "grades"} />
      </nav>
      <div title={user?.name} className="w-9 h-9 rounded-full bg-azure flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {firstName.slice(0, 2).toUpperCase()}
      </div>
    </aside>
  );
}

function SidebarLink({ icon, label, to, active = false }: { icon: ReactNode; label: string; to: string; active?: boolean }) {
  return <Link to={to} title={label} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${active ? "text-yellow bg-yellow/10" : "text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card"}`}>{icon}</Link>;
}

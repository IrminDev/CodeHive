import { DoorOpenIcon, ClipboardList, GraduationCap, Home, Presentation, Users } from "lucide-react";
import { Link } from "react-router";
import type { ReactNode } from "react";

import { useAuth } from "~/core/providers/AuthProvider";
import { canManageGroups } from "~/shared/lib/group-management";
import type { MobileNavItem } from "~/shared/components/MobileNavMenu";

export type StudentNavigation = "dashboard" | "groups" | "join" | "assignments" | "grades" | "notifications";

/** Student navigation, shared by the icon rail and the phone menu in StudentHeader. */
export function useStudentNavItems(): MobileNavItem[] {
  const { user } = useAuth();
  return [
    { key: "dashboard", icon: <Home size={20} />, label: "Dashboard", to: "/dashboard" },
    { key: "groups", icon: <Users size={20} />, label: "My groups", to: "/groups" },
    { key: "join", icon: <DoorOpenIcon size={20} />, label: "Join group", to: "/groups/join" },
    { key: "assignments", icon: <ClipboardList size={20} />, label: "Assignments", to: "/assignments" },
    { key: "grades", icon: <GraduationCap size={20} />, label: "Grades", to: "/grades" },
    ...(canManageGroups(user) ? [{ key: "manage", icon: <Presentation size={20} />, label: "Manage groups", to: "/teacher/groups" }] : []),
  ];
}

export function StudentSidebar({ active }: { active: StudentNavigation }) {
  const items = useStudentNavItems();

  return (
    <aside className="hidden sm:flex w-14 flex-shrink-0 flex-col items-center py-4 gap-1 bg-gray-50 dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800/60">
      <Link to="/dashboard" className="mb-4 flex-shrink-0" aria-label="Dashboard">
        <div style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} className="w-9 h-9 bg-yellow flex items-center justify-center">
          <span className="text-dark-bg font-bold text-sm leading-none">&lt;/&gt;</span>
        </div>
      </Link>
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2" aria-label="Student navigation">
        {items.map((item) => <SidebarLink key={item.key} icon={item.icon} label={item.label} to={item.to} active={active === item.key} />)}
      </nav>
    </aside>
  );
}

function SidebarLink({ icon, label, to, active = false }: { icon: ReactNode; label: string; to: string; active?: boolean }) {
  return <Link to={to} title={label} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${active ? "text-yellow bg-yellow/10" : "text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card"}`}>{icon}</Link>;
}

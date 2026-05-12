import React, { useState } from "react";
import { Link } from "react-router";
import {
  Menu, Bell, Settings, Sun, Moon, Code2,
  Home, BookOpen, Users, BarChart2, X,
} from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card rounded-md transition-colors sm:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <Link to="/teacher" className="flex items-center gap-2 font-semibold text-lg">
            <Code2 size={24} className="text-azure dark:text-yellow" />
            <span className="hidden sm:inline gradient-text">CodeHive</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Link to="/teacher" className="hover:text-azure dark:hover:text-yellow transition-colors">
              Dashboard
            </Link>
            <Link to="/teacher/assignments" className="hover:text-azure dark:hover:text-yellow transition-colors">
              Assignments
            </Link>
            <Link to="/teacher/groups" className="hover:text-azure dark:hover:text-yellow transition-colors">
              Groups
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors hidden sm:block"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          <button
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium leading-tight">{user?.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Teacher</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-azure to-french flex items-center justify-center font-bold text-white text-base select-none">
              {user?.name?.charAt(0)?.toUpperCase() || "T"}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed sm:static inset-y-0 left-0 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transform transition-all duration-300
            ${isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full sm:translate-x-0 sm:w-20 lg:w-64"}`}
        >
          <div className="p-4 flex items-center justify-between sm:hidden border-b border-gray-200 dark:border-gray-800">
            <span className="font-semibold gradient-text">CodeHive</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-md"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 flex flex-col gap-1 flex-1">
            <SidebarItem icon={<Home size={22} />} label="Dashboard" to="/teacher" />
            <SidebarItem icon={<BookOpen size={22} />} label="Assignments" to="/teacher/assignments" />
            <SidebarItem icon={<Users size={22} />} label="Groups" to="/teacher/groups" />
            <SidebarItem icon={<BarChart2 size={22} />} label="Analytics" to="/teacher/analytics" />
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function SidebarItem({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors group
        text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
    >
      <span className="group-hover:text-azure dark:group-hover:text-yellow transition-colors">
        {icon}
      </span>
      <span className="font-medium sm:hidden lg:block">{label}</span>
    </Link>
  );
}

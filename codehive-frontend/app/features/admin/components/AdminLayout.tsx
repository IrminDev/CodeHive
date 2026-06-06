import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { ProfileSettingsModal } from "~/features/dashboard/components/ProfileSettingsModal";
import logo from "~/assets/logo.png";

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumb?: string;
}

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    exact: true,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 transition-colors ${active ? "text-yellow" : "text-gray-400 dark:text-white/40"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/admin/users",
    exact: false,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 transition-colors ${active ? "text-yellow" : "text-gray-400 dark:text-white/40"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Courses",
    href: "/admin/courses",
    exact: false,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 transition-colors ${active ? "text-yellow" : "text-gray-400 dark:text-white/40"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

export function AdminLayout({ children, breadcrumb = "Overview" }: AdminLayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#06091a] transition-colors duration-300">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-[60px] flex-shrink-0 flex-col bg-white dark:bg-[#0b0f1f] border-r border-gray-200 dark:border-white/5 z-20">
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-gray-200 dark:border-white/5">
          <Link to="/admin">
            <img src={logo} alt="CodeHive" className="w-7 h-7 hover:scale-110 transition-transform" />
          </Link>
        </div>

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.label}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-yellow/15 dark:bg-yellow/10"
                    : "hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {item.icon(isActive)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-2 pb-4 pt-3 border-t border-gray-200 dark:border-white/5">
          <button
            title="Settings"
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200"
          >
            <svg className="w-5 h-5 text-gray-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setIsProfileOpen(true)}
            title={user?.name || "Profile"}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-azure to-french flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-azure/40 dark:hover:ring-yellow/40 transition-all"
          >
            {initials}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 lg:px-7 bg-white dark:bg-[#0b0f1f] border-b border-gray-200 dark:border-white/5 z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 dark:text-white/35 font-medium">Admin</span>
            <svg className="w-3.5 h-3.5 text-gray-300 dark:text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-800 dark:text-white font-medium">{breadcrumb}</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 w-52">
              <svg className="w-3.5 h-3.5 text-gray-400 dark:text-white/25 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs text-gray-400 dark:text-white/20 flex-1 select-none">Search assignments, groups…</span>
              <span className="text-[10px] text-gray-300 dark:text-white/15 font-mono border border-gray-200 dark:border-white/10 rounded px-1">⌘K</span>
            </div>

            {/* Bell */}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg className="w-4 h-4 hover:text-azure transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-yellow/50 hover:text-yellow transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <ProfileSettingsModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

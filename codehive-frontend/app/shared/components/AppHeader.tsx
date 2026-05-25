import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import logo from "~/assets/logo.png";

interface NavLink {
  label: string;
  to: string;
}

interface AppHeaderProps {
  navLinks?: NavLink[];
  badge?: string;
  logoLinkTo?: string;
  onMenuClick?: () => void;
}

export function AppHeader({
  navLinks,
  badge,
  logoLinkTo = "/",
  onMenuClick,
}: AppHeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="h-16 lg:h-20 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: hamburger + logo + nav */}
          <div className="flex items-center gap-3 sm:gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card rounded-lg transition-colors sm:hidden"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <Link to={logoLinkTo} className="flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="CodeHive"
                className="h-10 w-10 lg:h-12 lg:w-12 transition-transform group-hover:scale-110"
              />
              <span className="text-xl lg:text-2xl font-bold gradient-text">CodeHive</span>
              {badge && (
                <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow border border-azure/20 dark:border-yellow/20">
                  {badge}
                </span>
              )}
            </Link>

            {navLinks && navLinks.length > 0 && (
              <nav className="hidden md:flex items-center gap-6 ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="hover:text-azure dark:hover:text-yellow transition-colors duration-200 relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-azure dark:bg-yellow transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right: theme toggle + user */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg className="w-5 h-5 text-gray-600 group-hover:text-azure transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role?.toLowerCase() || "user"}
                </span>
              </div>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-azure to-french flex items-center justify-center font-bold text-white text-sm select-none transition-all duration-200 hover:ring-2 hover:ring-azure/50 dark:hover:ring-yellow/50 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow"
                aria-label="Open profile settings"
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <ProfileSettingsModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}

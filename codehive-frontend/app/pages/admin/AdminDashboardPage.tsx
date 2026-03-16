import { useTheme } from "../../context/ThemeContext";

export function AdminDashboardPage() {
  const { theme, toggleTheme } = useTheme();

  const navCards = [
    {
      title: "Create User",
      description: "Register a single user with a temporary password sent by email.",
      href: "/admin/create-user",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      title: "Bulk Registration",
      description: "Upload a CSV file to register up to 1500 users at once.",
      href: "/admin/csv-upload",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Top bar */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"
            >
              Back to site
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, Admin</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users and platform settings.</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {navCards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="group bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-azure dark:hover:border-yellow transition-all duration-200"
            >
              <div className="text-azure dark:text-yellow mb-4">{card.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-azure dark:group-hover:text-yellow transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
            </a>
          ))}
        </div>

        {/* Placeholder Stats */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">—</p>
            </div>
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Courses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">—</p>
            </div>
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Invitations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">—</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "~/core/providers/AuthProvider";
import { AppHeader } from "~/shared/components/AppHeader";

const NAV_CARDS = [
  {
    title: "Create User",
    description: "Register a single user with a temporary password sent by email.",
    href: "/admin/create-user",
    gradient: "from-azure to-french",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    title: "Bulk Registration",
    description: "Upload a CSV file to register up to 1500 users at once.",
    href: "/admin/csv-upload",
    gradient: "from-french to-imperial",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
];

const STATS = [
  {
    label: "Total Users",
    value: "—",
    gradient: "from-azure to-french",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Active Courses",
    value: "—",
    gradient: "from-yellow to-gold",
    textDark: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: "Pending Invitations",
    value: "—",
    gradient: "from-french to-azure",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-azure/5 dark:bg-azure/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-yellow/5 dark:bg-yellow/10 rounded-full blur-3xl" />
      </div>

      <AppHeader badge="Admin" logoLinkTo="/" />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div
          className={`mb-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-azure dark:bg-yellow animate-pulse" />
            <span className="text-sm font-medium text-azure dark:text-yellow">Admin Panel</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back,{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0] || "Admin"}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage users and monitor platform activity from here.
          </p>
        </div>

        {/* Action cards */}
        <div
          className={`mb-10 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20">
              <span className="text-xs font-medium text-azure dark:text-yellow">Quick Actions</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {NAV_CARDS.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="group relative bg-white dark:bg-dark-card rounded-2xl p-6 lg:p-8
                           border border-gray-200 dark:border-gray-700/50
                           hover:border-azure/50 dark:hover:border-yellow/50
                           transition-all duration-500 hover:shadow-xl hover:shadow-azure/5 dark:hover:shadow-yellow/5
                           hover:-translate-y-1"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl
                              bg-gradient-to-br ${card.gradient} text-white mb-5
                              group-hover:scale-110 transition-transform duration-300`}
                >
                  {card.icon}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  {card.description}
                </p>

                <div className="mt-5 flex items-center text-azure dark:text-yellow font-medium text-sm
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Go to {card.title}
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div
          className={`transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20">
              <span className="text-xs font-medium text-azure dark:text-yellow">Overview</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-dark-card rounded-2xl p-6
                           border border-gray-200 dark:border-gray-700/50
                           hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-xl
                              bg-gradient-to-br ${stat.gradient} ${stat.textDark ? "text-imperial" : "text-white"} mb-4`}
                >
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useAuth } from "~/core/providers/AuthProvider";
import { AdminLayout } from "../components/AdminLayout";

const STATS = [
  {
    label: "Total Users",
    value: "2,418",
    sub: "+42 this week",
    icon: (
      <svg className="w-5 h-5 text-[#4d9fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Active Classes",
    value: "54",
    sub: "12 across CS dept",
    icon: (
      <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: "Worker Uptime",
    value: "99.98%",
    sub: "last 30 days",
    icon: (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
  },
  {
    label: "Pending Invites",
    value: "7",
    sub: "oldest 2 days ago",
    icon: (
      <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const QUICK_ACTIONS = [
  {
    title: "Create user",
    description: "Provision a single account with a temporary password emailed to the user.",
    href: "/admin/create-user",
    icon: (
      <svg className="w-5 h-5 text-[#4d9fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    title: "Bulk registration",
    description: "Upload a CSV (≤1500 rows) and track progress via live WebSocket stream.",
    href: "/admin/csv-upload",
    icon: (
      <svg className="w-5 h-5 text-[#4d9fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Audit log",
    description: "Review every privileged action: signups, password resets, queue retries.",
    href: "#",
    icon: (
      <svg className="w-5 h-5 text-[#4d9fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
];

const RECENT_USERS = [
  { initials: "MH", color: "from-purple-500 to-purple-700", name: "María Hernández", email: "maria.garcia@ipn.mx", role: "TEACHER", enrollment: "2021630002", created: "2h ago", status: "Active" },
  { initials: "JG", color: "from-azure to-french", name: "Juan García", email: "juan@ipn.mx", role: "STUDENT", enrollment: "2021630001", created: "6h ago", status: "Active" },
  { initials: "SV", color: "from-green-500 to-emerald-700", name: "Sofía Velázquez", email: "sofia.vsim.mx", role: "STUDENT", enrollment: "2021630014", created: "yesterday", status: "Awaiting setup" },
  { initials: "DR", color: "from-orange-500 to-red-600", name: "Diego Ramírez", email: "d.ramirez@ipn.mx", role: "TEACHER", enrollment: "2021630007", created: "yesterday", status: "Active" },
];

const SERVICES = [
  { name: "API · Spring Boot", latency: "38ms", uptime: "99.99%" },
  { name: "Worker · Docker SDK", latency: "212ms", uptime: "99.94%" },
  { name: "RabbitMQ queues", latency: "14ms", uptime: "100%" },
  { name: "MinIO storage", latency: "52ms", uptime: "99.99%" },
  { name: "PostgreSQL", latency: "8ms", uptime: "100%" },
];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Admin";

  return (
    <AdminLayout breadcrumb="Overview">
      <div className="px-6 lg:px-8 py-6 space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow/10 border border-yellow/20">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
              <span className="text-yellow text-[10px] font-bold tracking-widest uppercase">Admin Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Hello, <span className="text-yellow">{firstName}.</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/40">
              <span className="font-semibold text-gray-700 dark:text-white/70">42 new accounts</span> provisioned this week.
              All worker queues healthy.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export report
            </button>
            <a
              href="/admin/create-user"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1557e0] hover:bg-[#1248c4] text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-900/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New user
            </a>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 p-4 flex items-start justify-between"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/30">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30">{stat.sub}</p>
              </div>
              <div className="mt-1 flex-shrink-0">{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="grid sm:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="group bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5
                         hover:border-[#4d9fff]/40 dark:hover:border-[#4d9fff]/30
                         transition-all duration-200 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#4d9fff]/10 dark:bg-[#4d9fff]/10 flex items-center justify-center flex-shrink-0">
                  {action.icon}
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-[#4d9fff] group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{action.title}</p>
                <p className="text-xs text-gray-500 dark:text-white/35 mt-0.5 leading-relaxed">{action.description}</p>
              </div>
            </a>
          ))}
        </div>

        {/* ── Bottom row ── */}
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4">

          {/* Recent users */}
          <div className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Recent users</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/30 border border-gray-200 dark:border-white/8">
                  Last 7 days
                </span>
              </div>
              <a href="#" className="text-xs text-[#4d9fff] hover:text-[#4d9fff]/70 transition-colors font-medium">
                View all
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/25">User</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/25">Role</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/25 hidden sm:table-cell">Enrollment</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/25 hidden md:table-cell">Created</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/25">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/3">
                  {RECENT_USERS.map((u) => (
                    <tr key={u.enrollment} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                            {u.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-gray-400 dark:text-white/25 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                          u.role === "TEACHER"
                            ? "bg-yellow/10 text-yellow border border-yellow/20"
                            : "bg-[#4d9fff]/10 text-[#4d9fff] border border-[#4d9fff]/20"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-500 dark:text-white/30 font-mono hidden sm:table-cell">
                        {u.enrollment}
                      </td>
                      <td className="px-3 py-3 text-gray-400 dark:text-white/25 hidden md:table-cell">
                        {u.created}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                          u.status === "Active"
                            ? "text-green-500"
                            : "text-yellow"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-green-500" : "bg-yellow"}`} />
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System status */}
          <div className="bg-white dark:bg-[#0d1526] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">System status</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                All operational
              </span>
            </div>

            <div className="px-5 py-3 space-y-1">
              {SERVICES.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-white/60">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-gray-400 dark:text-white/25 font-mono">{svc.latency}</span>
                    <span className="text-green-500 font-semibold">{svc.uptime}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5">
              <p className="text-[10px] text-gray-400 dark:text-white/25 font-medium tracking-wide">
                Queue throughput · last hour
              </p>
              {/* Placeholder bar chart */}
              <div className="flex items-end gap-0.5 h-8 mt-2">
                {[4, 7, 5, 9, 6, 8, 7, 10, 6, 8, 9, 7, 5, 8, 10, 9, 7, 6, 8, 9].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-[#4d9fff]/30 dark:bg-[#4d9fff]/20"
                    style={{ height: `${h * 10}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

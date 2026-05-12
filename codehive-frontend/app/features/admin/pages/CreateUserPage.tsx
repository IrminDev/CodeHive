import { useState } from "react";
import { useTheme } from "~/core/providers/ThemeProvider";
import { AuthService } from "~/features/auth/services/auth.service";
import { Role } from "~/shared/types/model/User";

const ROLE_OPTIONS = [
  { value: Role.STUDENT, label: "Student" },
  { value: Role.TEACHER, label: "Teacher" },
  { value: Role.ADMIN, label: "Admin" },
];

export function CreateUserPage() {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [fatherLastName, setFatherLastName] = useState("");
  const [motherLastName, setMotherLastName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await AuthService.signUp({
        email,
        name,
        fatherLastName,
        motherLastName,
        enrollmentNumber,
        role,
      });
      setSuccessMessage(
        "User created successfully. A welcome email with temporary credentials has been sent."
      );
      setName("");
      setFatherLastName("");
      setMotherLastName("");
      setEnrollmentNumber("");
      setEmail("");
      setRole(Role.STUDENT);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Background orb */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-azure/5 dark:bg-azure/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700
                         text-gray-500 dark:text-gray-400
                         hover:border-azure/50 dark:hover:border-yellow/50
                         hover:text-azure dark:hover:text-yellow transition-all duration-200"
              aria-label="Back to Admin Dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">Create User</span>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20">
                  <span className="text-xs font-medium text-azure dark:text-yellow">Admin</span>
                </div>
              </div>
            </div>
          </div>

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
      </header>

      {/* Content */}
      <main className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-4">
            <span className="text-sm font-medium text-azure dark:text-yellow">New User</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Register a <span className="gradient-text">new user</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A temporary password will be generated and sent to the user's email.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          {/* Status banners */}
          {successMessage && (
            <div className="flex items-start gap-3 mx-6 mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-3 mx-6 mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-5">
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                           focus:border-transparent transition-all duration-200"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Name row */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name(s)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                             focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="fatherLastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Father's Last Name
                </label>
                <input
                  id="fatherLastName"
                  type="text"
                  value={fatherLastName}
                  onChange={(e) => setFatherLastName(e.target.value)}
                  placeholder="García"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                             focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="motherLastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mother's Last Name
                </label>
                <input
                  id="motherLastName"
                  type="text"
                  value={motherLastName}
                  onChange={(e) => setMotherLastName(e.target.value)}
                  placeholder="López"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                             focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enrollment Number
                </label>
                <input
                  id="enrollmentNumber"
                  type="text"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  placeholder="2021630000"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                             focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-dark-surface text-gray-900 dark:text-white
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                           focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-700/50" />

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 text-base disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating user…
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create User
                </span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

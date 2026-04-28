import { useState } from "react";
import { useTheme } from "~/core/providers/ThemeProvider";
import { AuthService } from "~/features/auth/services/auth.service";
import { Role } from "~/shared/types/model/User";

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
      setSuccessMessage("User created successfully. A welcome email with temporary credentials has been sent.");
      setName("");
      setFatherLastName("");
      setMotherLastName("");
      setEnrollmentNumber("");
      setEmail("");
      setRole(Role.STUDENT);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Registration failed";
      setErrorMessage(message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Top bar */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Create User</h1>
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Register a new user</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              A temporary password will be generated and sent to the user's email.
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                         focus:border-transparent transition-all duration-200"
              >
                <option value={Role.STUDENT}>Student</option>
                <option value={Role.TEACHER}>Teacher</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name(s)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                         focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Father Last Name */}
            <div>
              <label htmlFor="fatherLastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Father's Last Name
              </label>
              <input
                id="fatherLastName"
                type="text"
                value={fatherLastName}
                onChange={(e) => setFatherLastName(e.target.value)}
                placeholder="García"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                         focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Mother Last Name */}
            <div>
              <label htmlFor="motherLastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mother's Last Name
              </label>
              <input
                id="motherLastName"
                type="text"
                value={motherLastName}
                onChange={(e) => setMotherLastName(e.target.value)}
                placeholder="López"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                         focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Enrollment Number */}
            <div>
              <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enrollment Number
              </label>
              <input
                id="enrollmentNumber"
                type="text"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                placeholder="e.g., 2021630000"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                         focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
                         focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating user...
                </div>
              ) : (
                "Create User"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

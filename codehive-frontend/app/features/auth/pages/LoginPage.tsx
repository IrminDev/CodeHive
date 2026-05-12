import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { useTheme } from "~/core/providers/ThemeProvider";
import { useAuth } from "~/core/providers/AuthProvider";
import { sileo } from "sileo";
import logo from "~/assets/logo.png";
import { AuthService } from "../services/auth.service";
import { setAuthToken } from "~/core/storage/token.storage";

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await AuthService.login({ identifier, password });
      setAuthToken(response.data.token);
      await refreshUser();
      sileo.success({ title: "Successfully logged in!" });
    } catch (error: any) {
      console.error(error);
      sileo.error({
        title: error.message || "Failed to log in. Check your credentials.",
      });
      setIsLoading(false);
    }
  };

  const features = [
    "Access all your classrooms",
    "Continue coding challenges",
    "Track your progress",
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Left panel ── */}
      <div
        className={`hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col px-16 xl:px-24 py-10
          bg-gradient-to-br from-[#1565C0] via-[#003F88] to-[#001840]
          ${mounted ? "animate-slide-in-left" : "opacity-0"}`}
      >
        {/* Subtle blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0566d9]/20 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#001840]/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Logo – top of panel */}
        <a href="/" className="relative z-10 flex items-center gap-3 group mb-auto">
          <img src={logo} alt="CodeHive" className="h-12 w-12 transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold text-white">CodeHive</span>
        </a>

        {/* Content – vertically centered */}
        <div className="relative z-10 space-y-12 my-auto">
          {/* Heading */}
          <div className="space-y-5">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Welcome back to <br />
              <span className="text-yellow">CodeHive</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              The ultimate engineering environment for academic excellence and
              technical mastery.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-6">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l2.5 2.5L16 9" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-lg">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Code block */}
          <div className="bg-[#0d1117]/80 backdrop-blur-sm rounded-xl p-6 max-w-sm border border-white/10 shadow-2xl animate-float">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="font-mono text-base space-y-1 text-white/80 leading-relaxed">
              <div>
                <span className="text-purple-400">const</span>
                <span className="text-white"> student </span>
                <span className="text-white">= {"{"}</span>
              </div>
              <div className="pl-4">
                <span className="text-[#79c0ff]">name</span>
                <span className="text-white">: </span>
                <span className="text-[#a5d6ff]">"You"</span>
                <span className="text-white">,</span>
              </div>
              <div className="pl-4">
                <span className="text-[#79c0ff]">status</span>
                <span className="text-white">: </span>
                <span className="text-[#a5d6ff]">"Ready to learn"</span>
              </div>
              <div>
                <span className="text-white">{"}"}</span>
                <span className="text-white">;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="relative z-10 mt-auto text-white/30 text-xs">
          © 2026 CodeHive.
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className={`w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#0d0d1e]
          transition-colors duration-300
          ${mounted ? "animate-slide-in-right" : "opacity-0"}`}
      >
        {/* Top bar – theme toggle */}
        <div className="flex items-center justify-between p-6 lg:p-8">
          {/* Mobile logo (left panel hidden on mobile) */}
          <a href="/" className="flex items-center gap-3 group lg:hidden">
            <img src={logo} alt="CodeHive" className="h-10 w-10 transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold gradient-text">CodeHive</span>
          </a>
          <div className="ml-auto lg:ml-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200
                       dark:hover:bg-white/20 transition-all duration-200 group"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg
                  className="w-5 h-5 text-gray-600 group-hover:text-azure transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-yellow group-hover:text-gold transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Form – centered vertically */}
        <div className="flex-1 flex items-center px-8 md:px-16 xl:px-20">
          <div className="w-full max-w-lg space-y-8">
            {/* Heading */}
            <header className="space-y-2">
              <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
                Sign in
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400">
                New here?{" "}
                <a
                  href="#"
                  className="text-azure dark:text-[#6ba3f5] hover:underline font-medium"
                >
                  Create one
                </a>{" "}
                account.
              </p>
            </header>

            {/* Form fields */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Identifier */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="block text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-500"
                >
                  Email or Enrollment Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400 group-focus-within:text-azure dark:group-focus-within:text-[#6ba3f5] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@university.edu"
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-lg
                             border border-gray-200 dark:border-white/10
                             bg-white dark:bg-white/5
                             text-gray-900 dark:text-white text-base
                             placeholder:text-gray-400 dark:placeholder:text-gray-600
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-[#6ba3f5]
                             focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-500"
                  >
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-gray-400 dark:text-gray-400 hover:text-azure dark:hover:text-white transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400 group-focus-within:text-azure dark:group-focus-within:text-[#6ba3f5] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3.5 rounded-lg
                             border border-gray-200 dark:border-white/10
                             bg-white dark:bg-white/5
                             text-gray-900 dark:text-white text-base
                             placeholder:text-gray-400 dark:placeholder:text-gray-600
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-[#6ba3f5]
                             focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center
                             text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-white/20
                           text-azure focus:ring-azure bg-white dark:bg-white/5"
                />
                <label
                  htmlFor="remember"
                  className="text-base text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-lg font-semibold text-base text-white
                         bg-[#1557e0] hover:bg-[#1248c4] active:scale-[0.98]
                         transition-all duration-200 shadow-lg shadow-blue-500/20
                         disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer – pinned to bottom */}
        <div className="px-8 md:px-16 xl:px-20 pb-8">
          <footer className="pt-6 border-t border-gray-100 dark:border-white/5">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a
                href="/privacy"
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Cookie Settings
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { useTheme } from "~/core/providers/ThemeProvider";
import { useAuth } from "~/core/providers/AuthProvider";
import { sileo } from "sileo";
import logo from "~/assets/logo.png";
import { AuthService } from "../services/auth.service";
import { setAuthToken } from "~/core/storage/token.storage";
import { getDashboardRoute } from "~/shared/lib/role-routing";
import { Cpu, Layers, Zap } from "lucide-react";
import { AuthEyebrow, AuthFeature, AuthSidePanel } from "../components/AuthSidePanel";

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      navigate(getDashboardRoute(user.role), { replace: true });
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

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Left panel ── */}
      <AuthSidePanel
        mounted={mounted}
        footer={
          <div className="grid grid-cols-3 gap-6">
            <AuthFeature icon={<Zap size={18} />} title="Instant verdicts" stacked detail="AC · WA · TLE · CE" />
            <AuthFeature icon={<Cpu size={18} />} title="Sandboxed exec" stacked detail="CPU · MEM · TIME" />
            <AuthFeature icon={<Layers size={18} />} title="4 languages" stacked detail="JAVA · PY · C · C++" />
          </div>
        }
      >
        <div className="space-y-8 short:space-y-5">
          <AuthEyebrow>The hive</AuthEyebrow>
          <div className="space-y-5">
            <h1 className="text-5xl xl:text-6xl short:text-4xl short:xl:text-5xl font-bold text-white leading-[1.05] tracking-tight">
              One reference solution. <br />
              <span className="text-yellow">Thousands</span> graded.
            </h1>
            <p className="max-w-lg text-lg short:text-base text-white/60 leading-relaxed">
              Sign in to publish assignments, review submissions, or pick up where you left off.
            </p>
          </div>

          {/* Code card */}
          <div className="max-w-md rounded-xl border border-white/10 bg-[#0d1117]/80 p-6 short:p-4 font-mono text-sm short:text-xs shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ml-auto text-xs text-white/40">welcome.ts</span>
            </div>
            <div className="space-y-1 leading-relaxed text-white/80">
              <div><span className="text-purple-400">const</span> <span className="text-[#79c0ff]">session</span> = <span className="text-purple-400">await</span> auth.login({"{"}</div>
              <div className="pl-4"><span className="text-[#79c0ff]">role</span>: <span className="text-[#a5d6ff]">"educator"</span>,</div>
              <div className="pl-4"><span className="text-[#79c0ff]">campus</span>: <span className="text-[#a5d6ff]">"ipn.mx"</span>,</div>
              <div>{"});"}</div>
              <div className="pt-3 text-green-400/80">{"// → redirecting to your dashboard"}</div>
            </div>
          </div>
        </div>
      </AuthSidePanel>

      {/* ── Right panel ── */}
      <div
        className={`w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#0d0d1e]
          transition-colors duration-300
          ${mounted ? "animate-slide-in-right" : "opacity-0"}`}
      >
        {/* Top bar – theme toggle */}
        <div className="flex items-center justify-between gap-4 p-6 lg:p-8">
          {/* Mobile logo (left panel hidden on mobile) */}
          <a href="/" className="flex items-center gap-3 group lg:hidden">
            <img src={logo} alt="CodeHive" className="h-10 w-10 transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold gradient-text">CodeHive</span>
          </a>
          <div className="ml-auto flex items-center gap-4">
            <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
              Don't have an account? <span className="font-medium text-gray-800 dark:text-gray-200">Ask your administrator.</span>
            </p>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 grid place-items-center rounded-lg border border-gray-200 dark:border-white/10
                       hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 group"
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
            <header className="space-y-4">
              <span className="inline-flex rounded-full border border-azure/20 bg-azure/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-azure dark:border-yellow/25 dark:bg-yellow/10 dark:text-yellow">
                Sign in
              </span>
              <h2 className="text-4xl xl:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome to <span className="text-azure dark:text-[#4d8fe8]">CodeHive</span>
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400">
                Sign in with your university email or enrollment number to continue.
              </p>
            </header>

            {/* Form fields */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Identifier */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="block font-mono text-xs tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400"
                >
                  Email or Enrollment #
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
                    className="block font-mono text-xs tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400"
                  >
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    aria-label="Forgot password?"
                    className="text-sm font-medium text-azure dark:text-yellow hover:underline underline-offset-4 transition-colors"
                  >
                    Forgot?
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
                        d="M5 17l5-5-5-5M12 19h7"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-lg font-semibold text-base text-white
                         bg-gradient-to-b from-[#1565C0] to-[#0b4ea2] hover:from-[#1a6fd3] hover:to-[#0d58b5] active:scale-[0.98]
                         transition-all duration-200 shadow-lg shadow-blue-600/30
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
                  <span className="inline-flex items-center justify-center gap-2">
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6l6 6-6 6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Legal note */}
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              By signing in you agree to the{" "}
              <a href="/terms" className="underline underline-offset-4 hover:text-gray-800 dark:hover:text-gray-200">Terms</a> and{" "}
              <a href="/privacy" className="underline underline-offset-4 hover:text-gray-800 dark:hover:text-gray-200">Privacy</a>.
            </p>
          </div>
        </div>

        {/* Footer – pinned to bottom */}
        <div className="px-8 md:px-16 xl:px-20 pb-8">
          <footer className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs text-gray-400 dark:text-gray-500">© 2026 CodeHive</span>
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
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

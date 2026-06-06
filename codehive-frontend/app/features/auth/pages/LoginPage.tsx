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

  const stats = [
    {
      icon: (
        <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: "Instant verdicts",
      sub: "100–800 ms",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
      label: "Sandboxed exec",
      sub: "Docker · TTY",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: "4 languages",
      sub: "JS · PY · C · C++",
    },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-[#06091a]">
      {/* ── Left panel ── */}
      <div
        className={`hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col px-14 xl:px-20 py-10
          bg-gradient-to-br from-[#0d1a3a] via-[#071128] to-[#030a1c]
          ${mounted ? "animate-slide-in-left" : "opacity-0"}`}
      >
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Hex grid */}
          <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
              <pattern
                id="hex-pattern-login"
                x="0"
                y="0"
                width="51.96"
                height="90"
                patternUnits="userSpaceOnUse"
              >
                <polygon
                  points="25.98,0 51.96,15 51.96,45 25.98,60 0,45 0,15"
                  fill="none"
                  style={{ stroke: "var(--hex-grid-stroke)" }}
                  strokeWidth="1"
                />
                <polygon
                  points="0,45 25.98,60 25.98,90 0,105 -25.98,90 -25.98,60"
                  fill="none"
                  style={{ stroke: "var(--hex-grid-stroke)" }}
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex-pattern-login)" />
          </svg>
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1557e0]/10 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#fdc500]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
        </div>

        {/* Logo */}
        <a href="/" className="relative z-10 flex items-center gap-3 group">
          <img src={logo} alt="CodeHive" className="h-10 w-10 transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold text-white tracking-tight">CodeHive</span>
        </a>

        {/* Main content */}
        <div className="relative z-10 flex flex-col justify-center flex-1 space-y-10 max-w-xl">
          {/* Badge */}
          <div className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow/10 border border-yellow/20">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
            <span className="text-yellow text-xs font-bold tracking-widest uppercase">The Hive</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              One reference
              <br />
              solution.
              <br />
              <span className="text-yellow">Thousands</span>
              <br />
              graded.
            </h1>
            <p className="mt-5 text-white/50 text-sm leading-relaxed max-w-xs">
              Sign in to publish assignments, review submissions, or pick up where you left off.
            </p>
          </div>

          {/* Code block */}
          <div className="bg-[#060d1e]/90 backdrop-blur-sm rounded-xl border border-white/8 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 text-white/20 text-xs font-mono">welcome.ts</span>
            </div>
            <div className="px-5 py-5 font-mono text-sm leading-loose">
              <div>
                <span className="text-purple-400">const</span>
                <span className="text-white"> session </span>
                <span className="text-white/50">= </span>
                <span className="text-yellow/80">await</span>
                <span className="text-[#79c0ff]"> auth</span>
                <span className="text-white/50">.</span>
                <span className="text-[#d2a8ff]">login</span>
                <span className="text-white/70">{"({"}</span>
              </div>
              <div className="pl-5">
                <span className="text-[#79c0ff]">role</span>
                <span className="text-white/50">: </span>
                <span className="text-[#a5d6ff]">"educator"</span>
                <span className="text-white/50">,</span>
              </div>
              <div className="pl-5">
                <span className="text-[#79c0ff]">campus</span>
                <span className="text-white/50">: </span>
                <span className="text-[#a5d6ff]">"lan.mx"</span>
              </div>
              <div>
                <span className="text-white/70">{"});"}</span>
                <span className="inline-block w-[2px] h-[0.9em] bg-white/50 animate-blink align-middle ml-0.5" />
              </div>
              <div className="mt-2 text-white/30">
                <span className="text-white/20">{"// "}</span>
                <span>— session.expires in 30 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8 mt-auto pt-6 border-t border-white/5">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              {s.icon}
              <div>
                <div className="text-white text-xs font-semibold leading-none">{s.label}</div>
                <div className="text-white/30 text-[10px] mt-0.5">{s.sub}</div>
              </div>
            </div>
          ))}
          <span className="ml-auto text-white/20 text-xs">© 2026</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className={`w-full lg:w-[48%] flex flex-col bg-white dark:bg-[#0b0f1f]
          transition-colors duration-300
          ${mounted ? "animate-slide-in-right" : "opacity-0"}`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 lg:px-12 py-6">
          {/* Mobile logo */}
          <a href="/" className="flex items-center gap-3 group lg:hidden">
            <img src={logo} alt="CodeHive" className="h-9 w-9 transition-transform group-hover:scale-110" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">CodeHive</span>
          </a>

          <div className="flex items-center gap-3 ml-auto lg:ml-0 w-full justify-end">
            <span className="text-gray-400 dark:text-white/30 text-sm hidden lg:block">Don't have an account?</span>
            <a
              href="#"
              className="text-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white font-medium px-3 py-1.5 rounded-lg
                       border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200"
            >
              Contact admin
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200
                         dark:hover:bg-gray-700 transition-all duration-200 group"
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
          </div>
        </div>

        {/* Form – centered */}
        <div className="flex-1 flex items-center px-8 md:px-14 xl:px-16">
          <div className="w-full max-w-md space-y-7">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow/10 border border-yellow/20">
              <span className="text-yellow text-xs font-bold tracking-widest uppercase">Sign in</span>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Welcome back to{" "}
                <span className="text-[#4d9fff]">the hive.</span>
              </h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">
                Sign in with your university email or enrollment number to continue.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Identifier */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="block text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40"
                >
                  Email or Enrollment #
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-300 dark:text-white/25 group-focus-within:text-azure dark:group-focus-within:text-[#4d9fff] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="l.hernandez@ipn.mx"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-lg
                             border border-gray-200 dark:border-white/8
                             bg-white dark:bg-white/4
                             text-gray-900 dark:text-white text-sm
                             placeholder:text-gray-400 dark:placeholder:text-white/20
                             focus:outline-none focus:ring-1 focus:ring-azure dark:focus:ring-[#4d9fff]/60
                             focus:border-azure dark:focus:border-[#4d9fff]/40
                             transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40"
                  >
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-azure dark:text-[#4d9fff]/70 hover:text-azure dark:hover:text-[#4d9fff] transition-colors"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-300 dark:text-white/25 group-focus-within:text-azure dark:group-focus-within:text-[#4d9fff] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-lg
                             border border-gray-200 dark:border-white/8
                             bg-white dark:bg-white/4
                             text-gray-900 dark:text-white text-sm
                             placeholder:text-gray-400 dark:placeholder:text-white/20
                             focus:outline-none focus:ring-1 focus:ring-azure dark:focus:ring-[#4d9fff]/60
                             focus:border-azure dark:focus:border-[#4d9fff]/40
                             transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center
                             text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[#1557e0] focus:ring-azure dark:focus:ring-[#4d9fff]/40"
                />
                <label htmlFor="remember" className="text-sm text-gray-500 dark:text-white/40 cursor-pointer">
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-lg font-semibold text-sm text-white
                         bg-[#1557e0] hover:bg-[#1248c4] active:scale-[0.98]
                         transition-all duration-200 shadow-lg shadow-blue-900/30
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>

            </form>

            {/* Terms */}
            <p className="text-[11px] text-gray-400 dark:text-white/20 leading-relaxed">
              By signing in you agree to the{" "}
              <a href="/terms" className="text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 underline underline-offset-2 transition-colors">Terms</a>
              {" "}and{" "}
              <a href="/privacy" className="text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 underline underline-offset-2 transition-colors">Privacy</a>
              . Sessions are JWT signed and rate-limited (5 / 60s).
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-8 lg:px-12 py-5 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
          <span className="text-gray-300 dark:text-white/20 text-xs font-mono">codehive.mx · v1.4.0</span>
          <div className="flex items-center gap-4">
            {["Status", "Docs", "Help"].map((link) => (
              <a key={link} href="#" className="text-xs text-gray-300 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/50 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

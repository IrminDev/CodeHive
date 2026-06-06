import { useState, useEffect } from "react";

import { useTheme } from "~/core/providers/ThemeProvider";
import logo from "~/assets/logo.png";
import { AuthService } from "../services/auth.service";

export function RecoveryPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEnrollmentNumber, setIsEnrollmentNumber] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isEmail = (value: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const usedEnrollmentNumber = !isEmail(identifier);
    setIsEnrollmentNumber(usedEnrollmentNumber);
    try {
      await AuthService.forgotPassword({ identifier });
      setIsSubmitted(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while sending the reset email.";
      alert(message);
    }
    setIsLoading(false);
  };

  const features = [
    {
      icon: (
        <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      label: "Single-use reset link",
      sub: "Invalidated after first use",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Expires in 24 hours",
      sub: "Auto self-destructs for safety",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      label: "Signed & rate-limited",
      sub: "JWT · 5 requests / 60s",
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
                id="hex-pattern-recovery"
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
            <rect width="100%" height="100%" fill="url(#hex-pattern-recovery)" />
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
            <span className="text-yellow text-xs font-bold tracking-widest uppercase">Security Protocol</span>
          </div>

          {/* Heading — changes on submit */}
          <div className="space-y-4">
            {isSubmitted ? (
              <>
                <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                  Check your
                  <br />
                  <span className="text-yellow">inbox.</span>
                </h1>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                  We've dispatched an encrypted, single-use link to your
                  registered address. Follow it to set a new password and
                  resume your workspace.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                  Forgot your
                  <br />
                  <span className="text-yellow">password?</span>
                </h1>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                  It happens to the best of us. Enter your email or enrollment
                  number and we'll send a secure link to reset it.
                </p>
              </>
            )}
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow/10 border border-yellow/20 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold leading-none">{f.label}</div>
                  <div className="text-white/30 text-[11px] mt-1">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <p className="relative z-10 mt-auto text-white/20 text-xs tracking-widest uppercase">
          Your account security is our priority
        </p>
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
            <a
              href="/login"
              className="hidden lg:inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/40
                         hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
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
            {!isSubmitted ? (
              <>
                {/* Terminal icon */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 flex items-center justify-center">
                  <span className="font-mono text-base font-bold text-gray-500 dark:text-white/50 select-none">
                    &gt;_
                  </span>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow/10 border border-yellow/20">
                  <span className="text-yellow text-xs font-bold tracking-widest uppercase">Reset Password</span>
                </div>

                {/* Heading */}
                <div className="space-y-2">
                  <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                    Let's get you{" "}
                    <span className="text-[#4d9fff]">back in.</span>
                  </h2>
                  <p className="text-gray-500 dark:text-white/40 text-sm">
                    Enter the email or enrollment number tied to your account and we'll send reset instructions.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        Sending...
                      </>
                    ) : (
                      <>
                        Send reset link
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Security tip */}
                <div className="relative rounded-xl overflow-hidden bg-yellow/5 border border-yellow/20 p-4">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow/60 rounded-l-xl" />
                  <div className="pl-3 flex gap-3 items-start">
                    <svg className="w-4 h-4 text-yellow flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-gray-600 dark:text-white/40 leading-relaxed">
                      <span className="font-semibold text-gray-800 dark:text-white/60">Security tip: </span>
                      The link is sent only to your registered address and expires in{" "}
                      <span className="font-semibold text-gray-900 dark:text-white/80">24 hours</span>.
                      Open it in the same browser for best results.
                    </p>
                  </div>
                </div>

                {/* Mobile back link */}
                <div className="text-center lg:hidden">
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to sign in
                  </a>
                </div>
              </>
            ) : (
              /* ── Success state ── */
              <div className="space-y-5">
                {/* Card */}
                <div className="rounded-2xl bg-gray-50 dark:bg-[#0f1628] border border-gray-200 dark:border-white/8 p-7 space-y-5 shadow-xl">

                  {/* Check icon — centered */}
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                      <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow/10 border border-yellow/20">
                      <span className="text-yellow text-xs font-bold tracking-widest uppercase">Email Sent</span>
                    </div>
                  </div>

                  {/* Heading + email */}
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                      Reset link on its way
                    </h2>
                    <p className="text-gray-500 dark:text-white/40 text-sm">
                      We've sent a password reset link to
                    </p>
                    {/* Email pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <svg className="w-3.5 h-3.5 text-[#4d9fff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-[#4d9fff] font-mono">{identifier}</span>
                    </div>
                  </div>

                  {/* Important note */}
                  <div className="flex gap-3 items-start rounded-xl bg-yellow/5 border border-yellow/15 p-4">
                    <svg className="w-4 h-4 text-yellow flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-gray-800 dark:text-white/70">Important</p>
                      <p className="text-xs text-gray-500 dark:text-white/30 leading-relaxed">
                        Use the link in the same browser session. Don't get it?
                        Check spam, or send a fresh one below.
                      </p>
                    </div>
                  </div>

                  {/* Send another link button */}
                  <button
                    onClick={() => { setIsSubmitted(false); setIdentifier(""); }}
                    className="w-full py-3.5 rounded-lg font-semibold text-sm text-white
                             bg-[#1557e0] hover:bg-[#1248c4] active:scale-[0.98]
                             transition-all duration-200 shadow-lg shadow-blue-900/30
                             flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Send another link
                  </button>
                </div>

                {/* Having trouble — outside card */}
                <p className="text-center text-sm text-gray-400 dark:text-white/25">
                  Having trouble?{" "}
                  <a href="#" className="text-yellow hover:text-yellow/80 underline underline-offset-2 transition-colors font-medium">
                    Contact support
                  </a>
                </p>
              </div>
            )}
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

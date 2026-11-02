import { useState, useEffect } from "react";

import { useTheme } from "~/core/providers/ThemeProvider";
import logo from "~/assets/logo.png";
import { AuthService } from "../services/auth.service";
import { Clock, KeyRound, ShieldCheck } from "lucide-react";
import { AuthEyebrow, AuthFeature, AuthSidePanel } from "../components/AuthSidePanel";

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


  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Left panel ── */}
      <AuthSidePanel
        mounted={mounted}
        footer={<p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-white/30">Your account security is our priority</p>}
      >
        <div className="space-y-8 short:space-y-5">
          <AuthEyebrow>Security protocol</AuthEyebrow>
          {isSubmitted ? (
            <div className="space-y-5">
              <h1 className="text-5xl xl:text-6xl short:text-4xl short:xl:text-5xl font-bold text-white leading-[1.05] tracking-tight">
                Check your <span className="text-yellow">inbox</span>.
              </h1>
              <p className="max-w-lg text-lg short:text-base text-white/60 leading-relaxed">
                We've sent a secure, single-use link to your registered address. Follow it to set a new password and resume your workspace.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <h1 className="text-5xl xl:text-6xl short:text-4xl short:xl:text-5xl font-bold text-white leading-[1.05] tracking-tight">
                Forgot your <br />
                <span className="text-yellow">password</span>?
              </h1>
              <p className="max-w-lg text-lg short:text-base text-white/60 leading-relaxed">
                It happens to the best of us. Enter your email or enrollment number and we'll send a secure link to reset it.
              </p>
            </div>
          )}

          <div className="space-y-5">
            <AuthFeature icon={<KeyRound size={18} />} title="Single-use reset link" detail="invalidated after first use" />
            <AuthFeature icon={<Clock size={18} />} title="Expires in 15 minutes" detail="a newer link replaces older ones" />
            <AuthFeature icon={<ShieldCheck size={18} />} title="Hashed & rate-limited" detail="stored hashed · 3 requests / 5 min" />
          </div>
        </div>
      </AuthSidePanel>

      {/* ── Right panel ── */}
      <div
        className={`w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#0d0d1e]
          transition-colors duration-300
          ${mounted ? "animate-slide-in-right" : "opacity-0"}`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-6 lg:p-8">
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

        {/* Form – centered vertically */}
        <div className="flex-1 flex items-center px-8 md:px-16 xl:px-20">
          <div className="w-full max-w-lg space-y-8">
            {!isSubmitted ? (
              <>
                {/* Icon + heading */}
                <div className="space-y-5">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#292839] border border-gray-200 dark:border-[#47464c]/30 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-gray-500 dark:text-[#dac3a6]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
                      Reset password
                    </h2>
                    <p className="text-base text-gray-500 dark:text-gray-400">
                      Enter the email address associated with your account
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="identifier"
                      className="block text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-500"
                    >
                      Email address
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
                        placeholder="you@example.com"
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
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>

                {/* Back to sign in */}
                <div className="text-center">
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-white transition-colors text-base"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to sign in
                  </a>
                </div>

                {/* Security tip */}
                <div className="relative rounded-xl overflow-hidden bg-[#0566d9]/5 border border-[#0566d9]/30 p-5">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0566d9]" />
                  <div className="pl-3 space-y-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-[#f7dfc0]">Security tip:</p>
                    <p className="text-sm text-gray-600 dark:text-[#c8c5cd] leading-relaxed">
                      The reset link will be sent to your registered email address
                      and will expire in{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">15 minutes</span> for security purposes.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* ── Success state ── */
              <div className="w-full max-w-lg">
                <div className="bg-white dark:bg-[#1e1e2e] rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl p-8 lg:p-10 space-y-8">
                  {/* Header – centered */}
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20">
                      <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Email sent!</h2>
                      <p className="text-base text-gray-500 dark:text-[#c8c5cd]">
                        {isEnrollmentNumber
                          ? "We've sent a reset link to the email associated with enrollment number"
                          : "We've sent a password reset link to:"}
                      </p>
                      <span className="text-azure dark:text-[#adc6ff] font-semibold inline-block">{identifier}</span>
                    </div>
                  </div>

                  {/* Callout box */}
                  <div className="bg-gray-50 dark:bg-[#292839] border border-gray-100 dark:border-white/5 rounded-lg p-5 flex gap-4">
                    <svg className="w-5 h-5 text-azure dark:text-[#adc6ff] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Important</p>
                      <p className="text-sm text-gray-500 dark:text-[#c8c5cd] leading-relaxed">The link works once and expires in 15 minutes. Didn't get it? Check spam, or send a new one below.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-5">
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="w-full py-4 rounded-lg font-semibold text-base text-white
                               bg-[#0566d9] hover:bg-[#0566d9]/90 active:scale-[0.98]
                               transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Send another link
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                    <div className="text-center">
                      <a href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-[#c8c5cd] hover:text-azure dark:hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to sign in
                      </a>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-6 border-t border-gray-100 dark:border-white/10 text-center">
                    <p className="text-sm text-gray-400 dark:text-[#c8c5cd]/60">
                      Having trouble? Contact your CodeHive administrator.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

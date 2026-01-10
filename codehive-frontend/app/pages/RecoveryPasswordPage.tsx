import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import logo from "../../assets/logo.png";
import { RecoveryPasswordService } from "~/services";
import type { ForgotPasswordRequest } from "~/types";

export function RecoveryPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await RecoveryPasswordService.forgotPassword({ email } as ForgotPasswordRequest).then(() => {    
      setIsSubmitted(true);
    }).catch((error) => {
      alert(error.message || "An error occurred while sending the reset email.");
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left side - Branding/Illustration */}
      <div className={`hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-imperial via-french to-azure ${mounted ? 'animate-slide-in-left' : 'opacity-0'}`}>
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-yellow/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-azure/20 rounded-full blur-3xl" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-24">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 mb-12">
            <img src={logo} alt="CodeHive" className="h-12 w-12" />
            <span className="text-2xl font-bold text-white">CodeHive</span>
          </a>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Forgot your<br />
            <span className="text-yellow">password?</span>
          </h1>
          
          <p className="text-lg text-white/80 max-w-md mb-12">
            No worries! It happens to the best of us. Enter your email and we'll send you instructions to reset your password.
          </p>

          {/* Security features */}
          <div className="space-y-4">
            {[
              { text: "Secure password reset link" },
              { text: "Link expires in 24 hours" },
              { text: "One-time use only" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-4 text-white/90">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Decorative lock illustration */}
          <div className="mt-16 bg-dark-bg/50 backdrop-blur-sm rounded-2xl p-8 max-w-md border border-white/10">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow/30 to-gold/30 flex items-center justify-center">
                  <svg className="w-12 h-12 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-center text-white/60 mt-6 text-sm">
              Your account security is our priority
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Recovery Form */}
      <div className={`w-full lg:w-1/2 xl:w-2/5 flex flex-col bg-white dark:bg-dark-bg transition-colors duration-300 ${mounted ? 'animate-slide-in-right' : 'opacity-0'}`}>
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center p-6 lg:p-8">
          {/* Mobile logo */}
          <a href="/" className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="CodeHive" className="h-8 w-8" />
            <span className="text-lg font-bold gradient-text">CodeHive</span>
          </a>
          <div className="lg:ml-auto" />
          
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 
                     dark:hover:bg-gray-700 transition-all duration-200 group"
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

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 xl:px-16 pb-12">
          <div className="w-full max-w-md">
            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  {/* Icon */}
                  <div className="mx-auto w-16 h-16 rounded-full bg-azure/10 dark:bg-yellow/10 flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-azure dark:text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    Reset password
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter the email address associated with your account
                  </p>
                </div>

                {/* Recovery form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                                 bg-white dark:bg-dark-card text-gray-900 dark:text-white
                                 placeholder:text-gray-400 dark:placeholder:text-gray-500
                                 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow 
                                 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-4 text-lg relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>

                {/* Back to login */}
                <div className="mt-8 text-center">
                  <a 
                    href="/login" 
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to sign in
                  </a>
                </div>
              </>
            ) : (
              /* Success state */
              <div className="text-center">
                {/* Success icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-bounce-once">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  Check your email
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We've sent password reset instructions to
                </p>
                <p className="text-azure dark:text-yellow font-medium text-lg mb-8">
                  {email}
                </p>

                {/* Email icon animation */}
                <div className="mx-auto w-32 h-32 rounded-2xl bg-gradient-to-br from-azure/10 to-french/10 dark:from-yellow/10 dark:to-gold/10 flex items-center justify-center mb-8">
                  <svg className="w-16 h-16 text-azure dark:text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Didn't receive the email? Check your spam folder or
                </p>

                {/* Resend button */}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-azure dark:text-yellow hover:underline font-medium"
                >
                  Try another email address
                </button>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-dark-bg text-gray-500 dark:text-gray-400">
                      or
                    </span>
                  </div>
                </div>

                {/* Back to login */}
                <a 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to sign in
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

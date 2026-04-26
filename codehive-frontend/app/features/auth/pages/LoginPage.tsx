import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { useTheme } from "~/core/providers/ThemeProvider";
import logo from "../../../../assets/logo.png";
import { AuthService } from "../services/auth.service";
import { setAuthToken } from "~/core/storage/token.storage";

export function LoginPage() {
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await AuthService.login({
        identifier,
        password,
      });
      setAuthToken(response.data.token);
      const user = response.data.user;
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left side - Branding/Illustration */}
      <div
        className={`hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-imperial via-french to-azure ${mounted ? "animate-slide-in-left" : "opacity-0"}`}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-yellow/20 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          />
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
            Welcome back to
            <br />
            <span className="text-yellow">CodeHive</span>
          </h1>

          <p className="text-lg text-white/80 max-w-md mb-12">
            Continue your coding journey. Access your classrooms, challenges, and
            track your progress.
          </p>

          {/* Features list */}
          <div className="space-y-4">
            {[
              { text: "Access all your classrooms" },
              { text: "Continue coding challenges" },
              { text: "Track your progress" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-4 text-white/90"
              >
                <span className="text-lg">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Decorative code block */}
          <div className="mt-16 bg-dark-bg/50 backdrop-blur-sm rounded-2xl p-6 max-w-md border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="font-mono text-sm space-y-1">
              <div>
                <span className="text-purple-400">const</span>
                <span className="text-white"> student </span>
                <span className="text-purple-400">=</span>
                <span className="text-white"> {`{`}</span>
              </div>
              <div className="pl-4">
                <span className="text-azure-light">name</span>
                <span className="text-white">: </span>
                <span className="text-green-400">"You"</span>
                <span className="text-white">,</span>
              </div>
              <div className="pl-4">
                <span className="text-azure-light">status</span>
                <span className="text-white">: </span>
                <span className="text-green-400">"Ready to learn"</span>
              </div>
              <div>
                <span className="text-white">{`}`};</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div
        className={`w-full lg:w-1/2 xl:w-2/5 flex flex-col bg-white dark:bg-dark-bg transition-colors duration-300 ${mounted ? "animate-slide-in-right" : "opacity-0"}`}
      >
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
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Sign in
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in with your credentials
              </p>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-dark-bg text-gray-500 dark:text-gray-400">
                  Continue with your credentials
                </span>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email or Enrollment Number field */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email or Enrollment Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                    placeholder="you@example.com or 2024123456"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-dark-card text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow 
                             focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-dark-card text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow 
                             focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me and Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 
                             text-azure dark:text-yellow focus:ring-azure dark:focus:ring-yellow
                             bg-white dark:bg-dark-card"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-azure dark:text-yellow hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-4 text-lg relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{" "}
              <a
                href="/terms"
                className="text-azure dark:text-yellow hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-azure dark:text-yellow hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import logo from "../../assets/logo.png";

export function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Handle login logic here
    console.log({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-imperial via-french to-azure">
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
            Welcome back to<br />
            <span className="text-yellow">CodeHive</span>
          </h1>
          
          <p className="text-lg text-white/80 max-w-md mb-12">
            Continue your coding journey. Access your classrooms, challenges, and track your progress.
          </p>

          {/* Features list */}
          <div className="space-y-4">
            {[
              { icon: "📚", text: "Access all your classrooms" },
              { icon: "💻", text: "Continue coding challenges" },
              { icon: "📊", text: "Track your progress" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-4 text-white/90">
                <span className="text-2xl">{item.icon}</span>
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
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col bg-white dark:bg-dark-bg transition-colors duration-300">
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
                Don't have an account?{" "}
                <a href="/signup" className="text-azure dark:text-yellow hover:underline font-medium">
                  Create one
                </a>
              </p>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 
                               transition-all duration-200 group">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    className="fill-[#4285F4]"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    className="fill-[#34A853]"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    className="fill-[#FBBC05]"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    className="fill-[#EA4335]"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
              </button>
              
              <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 
                               transition-all duration-200 group">
                <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-dark-bg text-gray-500 dark:text-gray-400">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-sm text-azure dark:text-yellow hover:underline font-medium">
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
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
              <a href="/terms" className="text-azure dark:text-yellow hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-azure dark:text-yellow hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

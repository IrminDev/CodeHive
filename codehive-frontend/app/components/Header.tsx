import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import logo from "../../assets/logo.png";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="CodeHive Logo"
              className="h-10 w-10 lg:h-12 lg:w-12 transition-transform group-hover:scale-110"
            />
            <span className="text-xl lg:text-2xl font-bold gradient-text">
              CodeHive
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 dark:text-gray-300 hover:text-azure dark:hover:text-yellow 
                         font-medium transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-azure dark:bg-yellow 
                               transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Theme Toggle */}
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

            <a
              href="/login"
              className="text-gray-700 dark:text-gray-300 hover:text-azure dark:hover:text-yellow 
                       font-medium transition-colors duration-200"
            >
              Sign In
            </a>
            <a href="/signup" className="btn-primary">
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-dark-card"
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

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-card"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? "max-h-96 pb-6" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 dark:text-gray-300 hover:text-azure dark:hover:text-yellow 
                         font-medium transition-colors duration-200 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <hr className="border-gray-200 dark:border-gray-700" />
            <a
              href="/login"
              className="text-gray-700 dark:text-gray-300 font-medium py-2"
            >
              Sign In
            </a>
            <a href="/signup" className="btn-primary text-center">
              Get Started
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}

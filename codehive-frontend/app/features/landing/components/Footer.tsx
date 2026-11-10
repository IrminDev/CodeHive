import logo from "~/assets/logo.png";


const footerLinks = {
  Platform: [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
  ],
  Account: [
    { name: "Sign In", href: "/login" },
    { name: "Forgot Password", href: "/forgot-password" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-gray-50 dark:bg-dark-surface border-t border-gray-200 dark:border-gray-800">
      {/* Footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-3 mb-6">
              <img src={logo} alt="CodeHive" className="h-10 w-10" />
              <span className="text-xl font-bold gradient-text">CodeHive</span>
            </a>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
              The modern platform for teaching programming. Create, evaluate, and inspire the next generation of developers.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} CodeHive. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

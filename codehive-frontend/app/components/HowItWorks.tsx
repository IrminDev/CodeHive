const steps = [
  {
    number: "01",
    title: "Create Your Classroom",
    description: "Set up your virtual classroom in minutes. Invite students with a simple code or link.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Design Challenges",
    description: "Create coding problems with test cases, time limits, and hints. Support for 20+ languages.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Students Code & Submit",
    description: "Students write and test code in our powerful online IDE, then submit for evaluation.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Instant Auto-Grading",
    description: "Our system runs submissions against your test cases and provides instant scores and feedback.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-azure/5 dark:bg-azure/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow/5 dark:bg-yellow/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-6">
            <span className="text-sm font-medium text-azure dark:text-yellow">
              Simple Process
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            How <span className="gradient-text-gold">CodeHive</span> Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Get started in minutes and transform the way you teach programming.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-azure via-yellow to-azure dark:from-azure dark:via-yellow dark:to-azure transform -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Card */}
                <div className="bg-white dark:bg-dark-card rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700/50 
                              hover:border-azure/50 dark:hover:border-yellow/50 transition-all duration-300 
                              hover:shadow-xl hover:shadow-azure/5 dark:hover:shadow-yellow/5 h-full">
                  {/* Number badge */}
                  <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                                bg-gradient-to-br from-azure to-french dark:from-yellow dark:to-gold 
                                text-white dark:text-imperial font-bold text-xl mb-6
                                group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="text-azure dark:text-yellow mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-dark-bg border-2 border-azure dark:border-yellow flex items-center justify-center">
                      <svg className="w-3 h-3 text-azure dark:text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 lg:mt-24">
          <a href="/signup" className="btn-primary inline-flex items-center gap-2 text-lg">
            Get Started Now
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

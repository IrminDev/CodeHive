import { useState } from "react";

const plans = [
  {
    name: "Free",
    description: "Perfect for individual educators getting started",
    price: { monthly: 0, annual: 0 },
    features: [
      "Up to 30 students",
      "1 classroom",
      "Basic code challenges",
      "Auto-grading",
      "Email support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    description: "For educators who want more power and flexibility",
    price: { monthly: 19, annual: 15 },
    features: [
      "Up to 150 students",
      "5 classrooms",
      "Advanced challenges",
      "Custom test cases",
      "Analytics dashboard",
      "Priority support",
      "Plagiarism detection",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Institution",
    description: "For schools and universities with custom needs",
    price: { monthly: null, annual: null },
    features: [
      "Unlimited students",
      "Unlimited classrooms",
      "White-label options",
      "LMS integration",
      "SSO / SAML",
      "Dedicated support",
      "Custom features",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-azure/5 dark:bg-azure/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow/5 dark:bg-yellow/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-6">
            <span className="text-sm font-medium text-azure dark:text-yellow">
              Simple Pricing
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose your <span className="gradient-text">plan</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 dark:bg-dark-card p-1 rounded-full">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                !isAnnual
                  ? "bg-white dark:bg-dark-surface text-azure dark:text-yellow shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                isAnnual
                  ? "bg-white dark:bg-dark-surface text-azure dark:text-yellow shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Annual
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-dark-card rounded-3xl p-8 
                        border transition-all duration-300 hover:shadow-xl
                        ${
                          plan.popular
                            ? "border-azure dark:border-yellow shadow-xl shadow-azure/10 dark:shadow-yellow/10 lg:scale-105"
                            : "border-gray-200 dark:border-gray-700/50 hover:border-azure/50 dark:hover:border-yellow/50"
                        }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-azure to-french text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    Custom Pricing
                  </div>
                )}
                {isAnnual && plan.price.annual !== null && plan.price.annual > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Billed annually (${plan.price.annual * 12}/year)
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 ${
                        plan.popular ? "text-azure dark:text-yellow" : "text-green-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="/signup"
                className={`block text-center py-4 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? "btn-primary"
                    : "btn-outline"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Trusted by leading institutions worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-50">
            {["MIT", "Stanford", "Harvard", "Berkeley", "CMU"].map((school) => (
              <span
                key={school}
                className="text-xl lg:text-2xl font-bold text-gray-400 dark:text-gray-600"
              >
                {school}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

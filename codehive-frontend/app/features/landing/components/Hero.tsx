import { useEffect, useState } from "react";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-10">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-azure/20 dark:bg-azure/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-yellow/20 dark:bg-yellow/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-french/10 dark:bg-french/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,80,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,80,157,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(253,197,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(253,197,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className={`space-y-8 text-center lg:text-left transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20">
              <span className="w-2 h-2 rounded-full bg-azure dark:bg-yellow animate-pulse" />
              <span className="text-sm font-medium text-azure dark:text-yellow">
                A platform built for eduators
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">Where </span>
              <span className="gradient-text">Coding</span>
              <br />
              <span className="text-gray-900 dark:text-white">Meets </span>
              <span className="gradient-text-gold">Classroom</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto lg:mx-0">
              Reduce your grading time with autograded assignments, designed to engage students and provide instant feedback.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="/login" className="btn-primary inline-flex items-center justify-center gap-2 text-lg">
                Get Started
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a href="#features" className="btn-outline inline-flex items-center justify-center gap-2 text-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See How It Works
              </a>
            </div>
          </div>

          {/* Illustration */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="relative">
              {/* Main card */}
              <div className="glass rounded-3xl p-6 lg:p-8 shadow-2xl">
                {/* Code editor mockup */}
                <div className="bg-dark-bg rounded-xl overflow-hidden">
                  {/* Editor header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-dark-surface border-b border-gray-700">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-gray-400 ml-4">challenge.py</span>
                  </div>
                  
                  {/* Code content */}
                  <div className="p-4 font-mono text-sm space-y-1">
                    <div>
                      <span className="text-purple-400">def</span>
                      <span className="text-yellow"> solve</span>
                      <span className="text-gray-300">(</span>
                      <span className="text-orange-300">arr</span>
                      <span className="text-gray-300">):</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-gray-500"># Find the maximum sum</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-purple-400">if not</span>
                      <span className="text-gray-300"> arr:</span>
                    </div>
                    <div className="pl-8">
                      <span className="text-purple-400">return</span>
                      <span className="text-blue-300"> 0</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-purple-400">return</span>
                      <span className="text-blue-300"> max</span>
                      <span className="text-gray-300">(</span>
                      <span className="text-blue-300">sum</span>
                      <span className="text-gray-300">(arr), </span>
                      <span className="text-blue-300">0</span>
                      <span className="text-gray-300">)</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-green-400">All tests passed!</span>
                    </div>
                  </div>
                </div>

                {/* Score badge */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-azure to-french flex items-center justify-center">
                      <span className="text-white font-bold">JS</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">John Student</div>
                      <div className="text-sm text-gray-500">Submitted 2 min ago</div>
                    </div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full font-bold">
                    100/100
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-6 -right-6 glass rounded-2xl p-4 shadow-xl animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow to-gold flex items-center justify-center">
                    <svg className="w-6 h-6 text-imperial" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Auto-Graded</div>
                    <div className="text-xs text-gray-500">25 submissions</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-12 -left-12 glass rounded-2xl p-4 shadow-xl animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-azure to-french flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Secure Sandbox</div>
                    <div className="text-xs text-gray-500">Isolated execution</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#features" className="flex flex-col items-center gap-2 text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors">
          <span className="text-sm">Explore</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
}

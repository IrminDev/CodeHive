import { useEffect, useState } from "react";

const INSTITUTIONS = ["UNAM", "IPN", "ITESM", "UAM", "UPV"];

const STATS = [
  { label: "Median grading time",   value: "8.4s",   sub: "down from 14 min manual"  },
  { label: "Languages sandboxed",   value: "4",       sub: "Java · Python · C · C++" },
  { label: "Submissions / week",    value: "128K",    sub: "across all campuses"       },
  { label: "Test verdict accuracy", value: "99.94%",  sub: "vs human-graded baseline" },
];

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeIn = (delay = "") =>
    `transition-all duration-1000 ${delay} ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`;

  return (
    <section className="relative overflow-hidden bg-white dark:bg-dark-bg">

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-azure/15 dark:bg-azure/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/3 -right-40 w-96 h-96 bg-yellow/15 dark:bg-yellow/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />

        {/* Hex grid */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <pattern
              id="hex-pattern"
              x="0"
              y="0"
              width="51.96"
              height="90"
              patternUnits="userSpaceOnUse"
            >
              {/* Hex 1 — center (25.98, 30) */}
              <polygon
                points="25.98,0 51.96,15 51.96,45 25.98,60 0,45 0,15"
                fill="none"
                style={{ stroke: "var(--hex-grid-stroke)" }}
                strokeWidth="1"
              />
              {/* Hex 2 — center (0, 75), wraps at tile edges */}
              <polygon
                points="0,45 25.98,60 25.98,90 0,105 -25.98,90 -25.98,60"
                fill="none"
                style={{ stroke: "var(--hex-grid-stroke)" }}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">

        {/* ── Hero grid ── */}
        <div className="grid lg:grid-cols-[2fr_3fr] gap-10 lg:gap-16 items-center min-h-[calc(100vh-80px)] pt-28 pb-16">

          {/* Left — copy */}
          <div className={`space-y-8 ${fadeIn()}`}>

            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 dark:bg-dark-surface border border-gray-700 dark:border-gray-600 text-yellow text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-yellow animate-pulse" />
                Built for educators
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                used at 240+ institutions
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-extrabold leading-[0.95] tracking-tight">
              <span className="text-gray-900 dark:text-white">Code class,</span>
              <br />
              <span className="text-gray-900 dark:text-white">finally</span>
              <br />
              <span className="gradient-text">grades itself.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
              Author one reference solution. CodeHive sandboxes every student
              submission, generates expected outputs, and returns verdicts in
              seconds — so you can teach, not grade.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/login"
                className="btn-primary inline-flex items-center justify-center gap-2 text-base"
              >
                Start free trial
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-base hover:border-azure dark:hover:border-yellow hover:text-azure dark:hover:text-yellow transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch 2-min demo
              </a>
            </div>
          </div>

          {/* Right — glass editor card */}
          <div className={`relative ${fadeIn("delay-300")}`}>
            <div className="relative">

              {/* Main glass card */}
              <div className="glass rounded-3xl p-5 lg:p-6 shadow-2xl">

                {/* File tab row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400 bg-dark-bg/10 dark:bg-dark-surface px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                      two_sum.py
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      tests/inputs/3 of 8
                    </span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-azure/10 dark:bg-azure/20 text-azure dark:text-azure-light">
                    PRACTICE · python 3.11
                  </span>
                </div>

                {/* Dark code editor */}
                <div className="bg-dark-bg rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-surface border-b border-gray-700/60">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-gray-500 ml-2 font-mono">two_sum.py</span>
                  </div>

                  <div className="p-4 font-mono text-sm space-y-0.5 leading-relaxed">
                    <div>
                      <span className="text-purple-400">def </span>
                      <span className="text-yellow">two_sum</span>
                      <span className="text-gray-300">(</span>
                      <span className="text-orange-300">nums</span>
                      <span className="text-gray-300">, </span>
                      <span className="text-orange-300">target</span>
                      <span className="text-gray-300">):</span>
                    </div>
                    <div className="pl-4 text-gray-500"># O(n) with a dict</div>
                    <div className="pl-4">
                      <span className="text-orange-300">seen</span>
                      <span className="text-gray-300"> = </span>
                      <span className="text-blue-300">{"{}"}</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-purple-400">for </span>
                      <span className="text-orange-300">i, n </span>
                      <span className="text-purple-400">in </span>
                      <span className="text-blue-300">enumerate</span>
                      <span className="text-gray-300">(nums):</span>
                    </div>
                    <div className="pl-8">
                      <span className="text-purple-400">if </span>
                      <span className="text-orange-300">target</span>
                      <span className="text-gray-300"> - n </span>
                      <span className="text-purple-400">in </span>
                      <span className="text-orange-300">seen</span>
                      <span className="text-gray-300">:</span>
                    </div>
                    <div className="pl-12">
                      <span className="text-purple-400">return </span>
                      <span className="text-gray-300">[seen[target - n], i]</span>
                    </div>
                    <div className="pl-8">
                      <span className="text-orange-300">seen</span>
                      <span className="text-gray-300">[n] = i</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-purple-400">return </span>
                      <span className="text-gray-300">[]</span>
                      <span className="inline-block w-[2px] h-[0.9em] bg-gray-300/60 animate-blink align-middle ml-0.5" />
                    </div>
                  </div>

                  {/* Submit bar */}
                  <div className="px-4 py-2.5 bg-dark-surface/50 border-t border-gray-700/60 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      8/8 tests · 14ms · 4.2MB
                    </span>
                    <span className="text-xs font-semibold text-azure dark:text-yellow">
                      ↵ submit
                    </span>
                  </div>
                </div>

                {/* Verdict row */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Accepted
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    graded in{" "}
                    <span className="font-semibold text-gray-600 dark:text-gray-300">8.4s</span>
                  </span>
                </div>

                {/* Docker isolation badge */}
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-azure/5 dark:bg-azure/10 border border-azure/10 dark:border-azure/20">
                  <svg className="w-4 h-4 text-azure flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-azure dark:text-azure-light">Docker-isolated</span>
                    {" · "}CPU · MEM · TIME limits enforced
                  </span>
                </div>
              </div>

              {/* Floating card — auto-graded (top-right) */}
              <div
                className="absolute -top-5 -right-5 glass rounded-2xl p-3.5 shadow-xl animate-float"
                style={{ animationDelay: "1s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow to-gold flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-imperial" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Auto-Graded</div>
                    <div className="text-xs text-gray-500">25 submissions</div>
                  </div>
                </div>
              </div>

              {/* Floating card — instant feedback (bottom-left) */}
              <div
                className="absolute -bottom-5 -left-5 glass rounded-2xl p-3.5 shadow-xl animate-float"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-azure to-french flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Instant Feedback</div>
                    <div className="text-xs text-gray-500">verdicts in seconds</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Institutions bar ── */}
        <div className={`border-t border-b border-gray-200 dark:border-gray-700/60 py-5 flex flex-wrap items-center gap-x-6 gap-y-3 ${fadeIn("delay-500")}`}>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 whitespace-nowrap">
            Powering CS departments at
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {INSTITUTIONS.map((name, i) => (
              <span key={name} className="flex items-center gap-5">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {name}
                </span>
                {i < INSTITUTIONS.length - 1 && (
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700/60 pb-16 ${fadeIn("delay-700")}`}>
          {STATS.map((stat) => (
            <div key={stat.value} className="px-6 pt-8 pb-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                {stat.label}
              </span>
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

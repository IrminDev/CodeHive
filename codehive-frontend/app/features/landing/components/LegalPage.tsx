import type { ReactNode } from "react";
import { ArrowLeft, Moon, Scale, Sun } from "lucide-react";
import { Link } from "react-router";

import logo from "~/assets/logo.png";
import { useTheme } from "~/core/providers/ThemeProvider";
import { Footer } from "./Footer";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

export const legalLinkClass = "font-medium text-azure underline underline-offset-4 hover:text-french dark:text-yellow dark:hover:text-gold";

export function LegalPage({ title, description, summary, active, sections }: {
  title: string;
  description: string;
  summary: string;
  active: "privacy" | "terms";
  sections: LegalSection[];
}) {
  const { theme, toggleTheme } = useTheme();

  return <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-dark-bg dark:text-gray-100">
    <a href="#legal-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-azure focus:p-3 focus:text-white">Skip to content</a>
    <header className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-dark-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="CodeHive home" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow">
          <img src={logo} alt="" className="h-9 w-9" />
          <span className="gradient-text text-xl font-bold">CodeHive</span>
        </Link>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-400 dark:hover:bg-dark-card dark:focus-visible:ring-yellow">
            {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-azure hover:bg-azure/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:hover:bg-yellow/10 dark:focus-visible:ring-yellow">Sign in</Link>
        </div>
      </div>
    </header>

    <main id="legal-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-azure dark:text-gray-400 dark:hover:text-yellow"><ArrowLeft size={14} aria-hidden="true" /> Back to CodeHive</Link>
      <div className="max-w-3xl">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-azure dark:text-yellow"><Scale size={15} aria-hidden="true" /> Legal information</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Last updated <time dateTime="2026-10-18">October 18, 2026</time></p>
      </div>
      <nav aria-label="Legal pages" className="mt-7 flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {([{ key: "privacy", label: "Privacy Policy", to: "/privacy" }, { key: "terms", label: "Terms of Service", to: "/terms" }] as const).map(item => <Link key={item.key} to={item.to} aria-current={active === item.key ? "page" : undefined}
          className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow ${active === item.key ? "border-azure text-azure dark:border-yellow dark:text-yellow" : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}>{item.label}</Link>)}
      </nav>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="On this page" className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-dark-surface lg:sticky lg:top-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">On this page</h2>
          <ol className="space-y-2.5">
            {sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="flex gap-2 text-sm text-gray-600 hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-400 dark:hover:text-yellow dark:focus-visible:ring-yellow"><span className="font-mono text-xs text-gray-400">{String(index + 1).padStart(2, "0")}</span>{section.title}</a></li>)}
          </ol>
        </nav>
        <article aria-label={title} className="min-w-0">
          <div className="mb-8 rounded-xl border border-azure/20 bg-azure/5 p-5 text-sm leading-7 text-gray-700 dark:border-yellow/20 dark:bg-yellow/5 dark:text-gray-300">{summary}</div>
          <div className="space-y-9">
            {sections.map((section, index) => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-6 border-b border-gray-100 pb-8 last:border-0 dark:border-gray-800">
              <h2 id={`${section.id}-title`} className="mb-3 text-lg font-semibold">{index + 1}. {section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{section.content}</div>
            </section>)}
          </div>
        </article>
      </div>
    </main>
    <Footer />
  </div>;
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Users } from "lucide-react";
import { joinGroup, listMyGroups } from "../api/group.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { ClassGroup } from "../types/group.types";


const BADGE_COLORS = [
  "bg-azure",
  "bg-french",
  "bg-imperial",
];

/* ── Page ── */

const CODE_LENGTH = 8;

export function JoinGroupPage() {
  const navigate = useNavigate();

  const [chars, setChars] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [groups, setGroups] = useState<ClassGroup[]>([]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const code = chars.join("").toUpperCase();
  const filled = chars.filter(Boolean).length;

  useEffect(() => {
    listMyGroups()
      .catch(() => [])
      .then(setGroups);
  }, []);

  function handleChange(i: number, val: string) {
    const ch = val.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...chars];
    next[i] = ch;
    setChars(next);
    setError(null);
    if (ch && i < CODE_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (chars[i]) {
        const next = [...chars]; next[i] = ""; setChars(next);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
      setError(null);
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      inputRefs.current[i + 1]?.focus();
    } else if (e.key === "Enter") {
      handleJoin();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setChars(next);
    setError(null);
    const focusIdx = Math.min(text.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleJoin() {
    if (filled === 0) return;
    setJoining(true);
    setError(null);
    try {
      await joinGroup(code);
      setSuccess(true);
      setTimeout(() => navigate("/groups"), 1500);
    } catch (err) {
      setError((err as Error).message || `No active group found for code ${code}. Check with your teacher and try again.`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">

      <StudentSidebar active="join" />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Groups", to: "/groups" }, { label: "Join" }]} />

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto scrollbar-hide px-8 py-10">
          <div className="max-w-lg mx-auto">

            {/* Hero */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow/10 text-yellow mb-5">
                <Users size={28} />
              </div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-yellow/40 bg-yellow/5 text-yellow text-[10px] font-semibold uppercase tracking-widest mb-4">
                Join a class
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Enter your{" "}
                <span className="text-azure">join code</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask your teacher for the 8-character code. Codes aren't case-sensitive.
              </p>
            </div>

            {/* Code card */}
            <div className="rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 p-6 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-mono mb-4">
                Join code
              </p>

              {/* 8 boxes */}
              <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
                {chars.map((ch, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="text"
                    maxLength={2}
                    value={ch}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                    className={`w-11 h-12 rounded-xl border-2 text-center text-lg font-bold font-mono transition-all focus:outline-none
                      ${ch
                        ? "border-yellow/60 bg-yellow/5 text-yellow dark:text-yellow"
                        : "border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card text-gray-300 dark:text-gray-600"
                      }
                      focus:border-yellow/80 focus:bg-yellow/5
                    `}
                    placeholder=""
                    aria-label={`Character ${i + 1}`}
                  />
                ))}
              </div>

              {/* Join button */}
              <button
                onClick={handleJoin}
                disabled={joining || success}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all
                  ${success
                    ? "bg-green-600 text-white"
                    : "bg-azure text-white hover:bg-azure/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  }
                `}
              >
                {success ? (
                  <>Joined! Redirecting…</>
                ) : joining ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining…
                  </>
                ) : (
                  <>Join class →</>
                )}
              </button>

              {/* Note */}
              <div className="flex items-start gap-2 mt-4">
                <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                  Only students can join with a code. Rejoining after leaving restores your previous enrollment history.
                </p>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400 leading-relaxed">
                  {error.includes(code) ? (
                    <>
                      No active group found for code{" "}
                      <span className="font-bold font-mono text-yellow">{code}</span>
                      . Check with your teacher and try again.
                    </>
                  ) : error}
                </p>
              </div>
            )}

            {/* My groups */}
            {groups.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Already in these groups
                </p>
                <div className="rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 overflow-hidden">
                  {groups.map((g, i) => (
                    <div
                      key={g.id}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-100/50 dark:hover:bg-dark-card/40 transition-colors ${i < groups.length - 1 ? "border-b border-gray-100 dark:border-gray-800/40" : ""}`}
                    >
                      {/* Badge */}
                      <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-bold tabular-nums ${BADGE_COLORS[i % BADGE_COLORS.length]}`}>
                        {g.memberCount ?? "—"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{g.name}</p>
                        {g.schedule && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{g.schedule}</p>
                        )}
                      </div>

                      {/* Status */}
                      {g.archived ? (
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 px-2.5 py-1 rounded-full flex-shrink-0">
                          Read-only
                        </span>
                      ) : g.isActive ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-xs text-green-500 font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          <span className="text-xs text-gray-400 font-medium">Inactive</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

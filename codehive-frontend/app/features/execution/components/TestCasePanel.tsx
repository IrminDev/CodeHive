import React from "react";
import type { ExecutionReport } from "../../student/types/execution.types";
import { STATUS_STYLES } from "../config/execution.constants";

interface TestCasePanelProps {
  testCases: string[];
  setTestCases: React.Dispatch<React.SetStateAction<string[]>>;
  report: ExecutionReport | null;
  execError: string | null;
  sampleCount: number;
}

export function TestCasePanel({
  testCases,
  setTestCases,
  report,
  execError,
  sampleCount,
}: TestCasePanelProps) {
  function addTestCase() {
    setTestCases((prev) => [...prev, ""]);
  }

  function removeTestCase(i: number) {
    setTestCases((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTestCase(i: number, value: string) {
    setTestCases((prev) => prev.map((tc, idx) => (idx === i ? value : tc)));
  }

  return (
    <div className="h-full bg-white dark:bg-dark-surface flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Test Cases</span>
          {report && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {report.passedTests}/{report.totalTests} passed
            </span>
          )}
        </div>
        <button
          onClick={addTestCase}
          className="inline-flex items-center gap-1 text-xs font-medium text-azure dark:text-yellow hover:underline"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {execError && (
          <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
            {execError}
          </div>
        )}
        {report?.compilationError && (
          <div className="px-4 py-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 font-mono whitespace-pre-wrap">
            {report.compilationError}
          </div>
        )}
        <div className="flex gap-3 p-3 h-full min-h-[140px]">
          {testCases.map((tc, i) => {
            const result = report?.testCaseResults?.[i];
            const isSample = i < sampleCount;
            return (
              <div
                key={i}
                className={`flex-shrink-0 w-52 flex flex-col rounded-xl border overflow-hidden ${
                  result
                    ? STATUS_STYLES[result.status] ?? "border-gray-200 dark:border-gray-700/50"
                    : "border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-dark-card"
                }`}
              >
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-current/10 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">Case {i + 1}</span>
                    {isSample && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow">
                        Sample
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {result && (
                      <span className="text-xs font-bold">{result.status}</span>
                    )}
                    {!isSample && testCases.length > sampleCount + 1 && (
                      <button
                        onClick={() => removeTestCase(i)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="Remove test case"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={tc}
                  onChange={(e) => updateTestCase(i, e.target.value)}
                  readOnly={isSample}
                  placeholder="Input…"
                  className={`flex-1 w-full resize-none bg-transparent text-xs font-mono p-2 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 ${
                    isSample ? "cursor-default text-gray-500 dark:text-gray-400" : ""
                  }`}
                />
                {result && (result.executionTimeMs !== undefined || result.memoryUsedMb !== undefined) && (
                  <div className="px-2 py-1 text-[10px] opacity-70 border-t border-current/10 flex gap-2">
                    {result.executionTimeMs !== undefined && <span>{result.executionTimeMs}ms</span>}
                    {result.memoryUsedMb !== undefined && <span>{result.memoryUsedMb}MB</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

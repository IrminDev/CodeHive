import { useRef, useState, useCallback, useEffect } from "react";
import { submitExecution, getExecution, getExecutionReport } from "../../student/api/execution.api";
import { ExecutionStatus, ExecutionType, Language as ExecLanguage } from "../../student/types/execution.types";
import type { ExecutionReport } from "../../student/types/execution.types";
import type { Language } from "../../student/types/assignment.types";

export function useExecutionRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [execError, setExecError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const runCode = useCallback(async (
    code: string,
    language: Language,
    assignmentId: string,
    testCases: string[],
    userId?: string
  ) => {
    if (!code.trim() || isRunning) return;
    
    setIsRunning(true);
    setReport(null);
    setExecError(null);

    try {
      const dto = await submitExecution({
        code,
        language: language as unknown as ExecLanguage,
        requesterId: userId,
        assignmentId,
        testCases: testCases.filter((tc) => tc.trim().length > 0),
        executionType: ExecutionType.PRACTICE,
      });

      let attempts = 0;
      const maxAttempts = 40;

      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          attempts++;
          try {
            const updated = await getExecution(dto.id);
            if (updated.status !== ExecutionStatus.PENDING) {
              if (pollRef.current) clearInterval(pollRef.current);
              try {
                const r = await getExecutionReport(dto.id);
                setReport(r);
              } catch {
                // Report not available for CE
              }
              resolve();
            } else if (attempts >= maxAttempts) {
              if (pollRef.current) clearInterval(pollRef.current);
              reject(new Error("Execution timed out. Please try again."));
            }
          } catch (e) {
            if (pollRef.current) clearInterval(pollRef.current);
            reject(e);
          }
        }, 1500);
      });
    } catch (e: unknown) {
      setExecError(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  return { isRunning, report, execError, runCode };
}

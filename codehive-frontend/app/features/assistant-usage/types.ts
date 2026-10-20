export type Audience = "owner" | "personal" | "admin";
export interface Policy { enabled: boolean; maximumCurrent: number; level: string | null; version: number }
export interface Quota { usedLifetime: number; maximumCurrent: number; pendingReservations: number; remainingNow: number; limitReduced: boolean; enabled: boolean }
export interface Educational { requests: number; responses: number; completed: number; redirected: number; blocked: number; failed: number; cancelled: number; pending: number; activeUsers: number; respondingUsers: number; historicalUninstrumented: number; regenerations: number; editorOptIns: number; executionOptIns: number; averageLatencyMs: number | null; latencySamples: number; requestedLevels: Record<string, number>; deliveredLevels: Record<string, number>; lastActivity: string | null }
export interface Technical { calls: number; succeeded: number; failed: number; uncertain: number; callerTimeouts: number; knownInputTokens: number | null; knownOutputTokens: number | null; knownTotalTokens: number | null; measuredCalls: number; unknownCalls: number; coveragePercent: number | null; averageLatencyMs: number | null; latencySamples: number }
export interface Filters { from: string | null; to: string | null; userId: string | null; groupId: string | null; assignmentId: string | null; provider: string | null; model: string | null }
export interface Daily { day: string; requests: number; responses: number; calls: number; knownTotalTokens: number | null }
export interface Summary { generatedAt: string; filters: Filters; instrumentationStartedAt: string | null; educational: Educational; technical: Technical; trend: Daily[]; currentPolicy: Policy | null; label: string }
export interface UsageRow { id: string; label: string; enrollmentNumber: string | null; currentParticipant: boolean; requests: number; responses: number; unanswered: number; regenerations: number; lastActivity: string | null; calls: number; knownTotalTokens: number | null; quota: Quota | null; currentPolicy: Policy | null }
export interface UsagePage { content: UsageRow[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean }
export interface Breakdown { generatedAt: string; filters: Filters; instrumentationStartedAt: string | null; rows: UsagePage }
export interface ModelRow { provider: string | null; configuredModel: string | null; reportedModel: string | null; stage: string; technical: Technical }
export interface Models { generatedAt: string; filters: Filters; instrumentationStartedAt: string | null; rows: ModelRow[] }
export interface GroupOption { id: string; label: string; lifecycle: string }

export type SkillUsageStats = {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  totalTokens: number;
  avgTokensPerRun: number;
  lastRunAt: string | null;
  recentRuns: Array<{
    id: string;
    status: string;
    tokens: number;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    errorMessage: string | null;
  }>;
};

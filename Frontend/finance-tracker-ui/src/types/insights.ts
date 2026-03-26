export type HealthScore = {
  score: number;
  breakdown: Record<string, number>;
  suggestions: string[];
};

export type InsightMessage = {
  title: string;
  message: string;
  severity: string;
};

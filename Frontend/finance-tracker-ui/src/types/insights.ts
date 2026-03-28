export type HealthScore = {
  score: number;
  hasData?: boolean;
  note?: string;
  breakdown: Record<string, number>;
  suggestions: string[];
};

export type InsightMessage = {
  title: string;
  message: string;
  severity: string;
};

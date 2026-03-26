import { api } from "../../api/client";
import type { HealthScore, InsightMessage } from "../../types/insights";

export const getHealthScore = async () => {
  const res = await api.get<HealthScore>("/api/insights/health-score");
  return res.data;
};

export const getInsights = async () => {
  const res = await api.get<InsightMessage[]>("/api/insights");
  return res.data;
};

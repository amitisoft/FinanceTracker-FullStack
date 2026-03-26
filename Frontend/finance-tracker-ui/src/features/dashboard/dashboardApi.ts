import { api } from "../../api/client";
import type { DashboardSummary } from "../../types/dashboard";

export const getDashboardSummary = async (month: number, year: number) => {
  const response = await api.get<DashboardSummary>("/api/dashboard/summary", {
    params: { month, year },
  });

  return response.data;
};
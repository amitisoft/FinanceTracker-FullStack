import { api } from "../../api/client";
import type { MonthlyForecast, ForecastDailyPoint } from "../../types/forecast";

export const getMonthlyForecast = async () => {
  const res = await api.get<MonthlyForecast>("/api/forecast/month");
  return res.data;
};

export const getDailyForecast = async (start?: string, end?: string) => {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const res = await api.get<ForecastDailyPoint[]>("/api/forecast/daily", { params });
  return res.data;
};

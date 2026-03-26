import { api } from "../../api/client";
import type { TrendsReport, NetWorthPoint } from "../../types/reportsV2";

export const getTrendsReport = async (dateFrom: string, dateTo: string, accountId?: string) => {
  const params: Record<string, string> = { dateFrom, dateTo };
  if (accountId) params.accountId = accountId;
  const res = await api.get<TrendsReport>("/api/reports/trends", { params });
  return res.data;
};

export const getNetWorthReport = async (dateFrom: string, dateTo: string) => {
  const res = await api.get<NetWorthPoint[]>("/api/reports/net-worth", {
    params: { dateFrom, dateTo },
  });
  return res.data;
};

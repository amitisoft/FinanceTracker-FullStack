import { api } from "../../api/client";
import type {
  CategorySpendReportItem,
  IncomeVsExpenseReportItem,
  AccountBalanceTrendItem,
} from "../../types/report";

export const getCategorySpendReport = async (dateFrom: string, dateTo: string, accountId?: string) => {
  const response = await api.get<CategorySpendReportItem[]>("/api/reports/category-spend", {
    params: { dateFrom, dateTo, accountId },
  });
  return response.data;
};

export const getIncomeVsExpenseReport = async (dateFrom: string, dateTo: string) => {
  const response = await api.get<IncomeVsExpenseReportItem[]>("/api/reports/income-vs-expense", {
    params: { dateFrom, dateTo },
  });
  return response.data;
};

export const getAccountBalanceTrendReport = async (
  accountId: string,
  dateFrom: string,
  dateTo: string
) => {
  const response = await api.get<AccountBalanceTrendItem[]>("/api/reports/account-balance-trend", {
    params: { accountId, dateFrom, dateTo },
  });
  return response.data;
};
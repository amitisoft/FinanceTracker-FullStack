export type TrendPoint = {
  period: string;
  income: number;
  expense: number;
  savingsRate: number;
};

export type CategoryTrend = {
  period: string;
  categoryId: string;
  categoryName: string;
  totalAmount: number;
};

export type TrendsReport = {
  savingsRateTrend: TrendPoint[];
  categoryTrends: CategoryTrend[];
  incomeVsExpense: { period: string; income: number; expense: number; net: number }[];
};

export type NetWorthPoint = {
  date: string;
  netWorth: number;
};

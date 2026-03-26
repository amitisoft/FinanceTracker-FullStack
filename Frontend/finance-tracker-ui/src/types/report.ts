export type CategorySpendReportItem = {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
};

export type IncomeVsExpenseReportItem = {
  period: string;
  income: number;
  expense: number;
  net: number;
};

export type AccountBalanceTrendItem = {
  date: string;
  balance: number;
};
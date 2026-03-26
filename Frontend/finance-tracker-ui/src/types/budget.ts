export type Budget = {
  id: string;
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
  amount: number;
  alertThresholdPercent: number;
  spent: number;
  remaining: number;
  progressPercent: number;
  triggeredThreshold?: number | null;
};

export type CreateBudgetRequest = {
  categoryId: string;
  month: number;
  year: number;
  amount: number;
  alertThresholdPercent: number;
};
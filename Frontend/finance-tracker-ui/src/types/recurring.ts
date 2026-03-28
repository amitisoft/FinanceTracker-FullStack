export type RecurringTransaction = {
  id: string;
  title: string;
  type: string;
  amount: number;
  categoryId?: string | null;
  accountId?: string | null;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  nextRunDate: string;
  autoCreateTransaction: boolean;
  isPaused: boolean;
};

export type CreateRecurringRequest = {
  title: string;
  type: string;
  amount: number;
  categoryId?: string;
  accountId?: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  autoCreateTransaction: boolean;
};

export type UpdateRecurringRequest = {
  title: string;
  type: string;
  amount: number;
  categoryId?: string | null;
  accountId?: string | null;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  nextRunDate: string;
  autoCreateTransaction: boolean;
  isPaused: boolean;
};

export type RecurringProcessResult = {
  processedCount: number;
  createdTransactionIds: string[];
};

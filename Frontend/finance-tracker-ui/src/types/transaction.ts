export type Transaction = {
  id: string;
  accountId: string;
  categoryId?: string | null;
  type: string;
  amount: number;
  date: string;
  merchant?: string | null;
  note?: string | null;
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransactionRequest = {
  type: string;
  amount: number;
  date: string;
  accountId: string;
  categoryId?: string;
  merchant?: string;
  note?: string;
  paymentMethod?: string;
};

export type UpdateTransactionRequest = CreateTransactionRequest;

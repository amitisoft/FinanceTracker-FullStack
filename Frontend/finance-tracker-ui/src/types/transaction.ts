export type Transaction = {
  id: string;
  accountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  type: string;
  amount: number;
  date: string;
  merchant?: string | null;
  note?: string | null;
  paymentMethod?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTransactionRequest = {
  type: string;
  amount: number;
  date: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  merchant?: string;
  note?: string;
  paymentMethod?: string;
  tags?: string[];
};

export type UpdateTransactionRequest = CreateTransactionRequest;

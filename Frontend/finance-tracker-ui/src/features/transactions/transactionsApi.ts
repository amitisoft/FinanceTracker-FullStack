import { api } from "../../api/client";
import type { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from "../../types/transaction";

export type TransactionQuery = {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
  type?: string;
  search?: string;
  sortBy?: "date" | "amount" | "created";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export const getTransactions = async (query: TransactionQuery = {}) => {
  const response = await api.get<Transaction[]>("/api/transactions", { params: query });
  return response.data;
};

export const createTransaction = async (payload: CreateTransactionRequest) => {
  const response = await api.post<Transaction>("/api/transactions", payload);
  return response.data;
};

export const updateTransaction = async (id: string, payload: UpdateTransactionRequest) => {
  const response = await api.put<Transaction>(`/api/transactions/${id}`, payload);
  return response.data;
};

export const deleteTransaction = async (id: string) => {
  await api.delete(`/api/transactions/${id}`);
};

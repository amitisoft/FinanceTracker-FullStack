import { api } from "../../api/client";
import type { Transaction, CreateTransactionRequest } from "../../types/transaction";

export const getTransactions = async () => {
  const response = await api.get<Transaction[]>("/api/transactions");
  return response.data;
};

export const createTransaction = async (payload: CreateTransactionRequest) => {
  const response = await api.post<Transaction>("/api/transactions", payload);
  return response.data;
};
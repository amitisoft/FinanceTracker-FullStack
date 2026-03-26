import { api } from "../../api/client";
import type { Account, CreateAccountRequest } from "../../types/account";

export const getAccounts = async () => {
  const response = await api.get<Account[]>("/api/accounts");
  return response.data;
};

export const createAccount = async (payload: CreateAccountRequest) => {
  const response = await api.post<Account>("/api/accounts", payload);
  return response.data;
};
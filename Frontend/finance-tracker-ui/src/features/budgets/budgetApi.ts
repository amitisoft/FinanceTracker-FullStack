import { api } from "../../api/client";
import type { Budget, CreateBudgetRequest } from "../../types/budget";

export const getBudgets = async (month: number, year: number) => {
  const response = await api.get<Budget[]>("/api/budgets", {
    params: { month, year },
  });
  return response.data;
};

export const createBudget = async (payload: CreateBudgetRequest) => {
  const response = await api.post<Budget>("/api/budgets", payload);
  return response.data;
};

export const deleteBudget = async (id: string) => {
  await api.delete(`/api/budgets/${id}`);
};
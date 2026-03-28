import { api } from "../../api/client";
import type {
  RecurringTransaction,
  CreateRecurringRequest,
  UpdateRecurringRequest,
  RecurringProcessResult,
} from "../../types/recurring";

export const getRecurring = async () => {
  const response = await api.get<RecurringTransaction[]>("/api/recurring");
  return response.data;
};

export const createRecurring = async (payload: CreateRecurringRequest) => {
  const response = await api.post<RecurringTransaction>("/api/recurring", payload);
  return response.data;
};

export const deleteRecurring = async (id: string) => {
  await api.delete(`/api/recurring/${id}`);
};

export const updateRecurring = async (id: string, payload: UpdateRecurringRequest) => {
  const response = await api.put<RecurringTransaction>(`/api/recurring/${id}`, payload);
  return response.data;
};

export const processDueRecurring = async (asOfDate?: string) => {
  const response = await api.post<RecurringProcessResult>("/api/recurring/process-due", null, {
    params: asOfDate ? { asOfDate } : {},
  });
  return response.data;
};

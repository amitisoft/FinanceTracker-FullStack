import { api } from "../../api/client";
import type { Rule, UpsertRuleInput } from "../../types/rule";

export const getRules = async () => {
  const res = await api.get<Rule[]>("/api/rules");
  return res.data;
};

export const createRule = async (payload: UpsertRuleInput) => {
  const res = await api.post<Rule>("/api/rules", payload);
  return res.data;
};

export const updateRule = async (id: string, payload: UpsertRuleInput) => {
  const res = await api.put<Rule>(`/api/rules/${id}`, payload);
  return res.data;
};

export const deleteRule = async (id: string) => {
  await api.delete(`/api/rules/${id}`);
};

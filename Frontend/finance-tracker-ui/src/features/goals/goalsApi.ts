import { api } from "../../api/client";
import type {
  Goal,
  CreateGoalRequest,
  GoalContributionRequest,
  GoalWithdrawRequest,
} from "../../types/goal";

export const getGoals = async () => {
  const response = await api.get<Goal[]>("/api/goals");
  return response.data;
};

export const createGoal = async (payload: CreateGoalRequest) => {
  const response = await api.post<Goal>("/api/goals", payload);
  return response.data;
};

export const contributeGoal = async (id: string, payload: GoalContributionRequest) => {
  const response = await api.post<Goal>(`/api/goals/${id}/contribute`, payload);
  return response.data;
};

export const withdrawGoal = async (id: string, payload: GoalWithdrawRequest) => {
  const response = await api.post<Goal>(`/api/goals/${id}/withdraw`, payload);
  return response.data;
};

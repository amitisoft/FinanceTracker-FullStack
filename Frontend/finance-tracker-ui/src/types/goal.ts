export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  targetDate?: string | null;
  linkedAccountId?: string | null;
  icon?: string | null;
  color?: string | null;
  status: string;
};

export type CreateGoalRequest = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  linkedAccountId?: string;
  icon?: string;
  color?: string;
};

export type GoalContributionRequest = {
  amount: number;
  sourceAccountId?: string;
};

export type GoalWithdrawRequest = {
  amount: number;
  destinationAccountId?: string;
};
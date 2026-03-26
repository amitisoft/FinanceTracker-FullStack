export type BudgetProgressCard = {
    budgetId: string;
    categoryId: string;
    categoryName: string;
    budgetAmount: number;
    spent: number;
    remaining: number;
    progressPercent: number;
    triggeredThreshold?: number | null;
};

export type CategorySpending = {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
};

export type RecentTransaction = {
    id: string;
    type: string;
    amount: number;
    date: string;
    merchant?: string | null;
    note?: string | null;
    accountName: string;
    categoryName: string;
};

export type DashboardSummary = {
    month: number;
    year: number;
    incomeTotal: number;
    expenseTotal: number;
    net: number;
    totalAccountBalance: number;
    budgetProgressCards: BudgetProgressCard[];
    categorySpending: CategorySpending[];
    recentTransactions: RecentTransaction[];
    goalsSummary: unknown[];
    upcomingRecurring: unknown[];
};
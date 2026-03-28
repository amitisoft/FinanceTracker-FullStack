namespace FinanceTracker.Application.Dashboard.DTOs;

public class DashboardSummaryDto
{
    public int Month { get; set; }

    public int Year { get; set; }

    public decimal IncomeTotal { get; set; }

    public decimal ExpenseTotal { get; set; }

    public decimal Net { get; set; }

    public decimal TotalAccountBalance { get; set; }

    public IReadOnlyList<BudgetProgressDto> BudgetProgressCards { get; set; } = [];

    public IReadOnlyList<CategorySpendDto> CategorySpending { get; set; } = [];

    public IReadOnlyList<RecentTransactionDto> RecentTransactions { get; set; } = [];

    public IReadOnlyList<GoalSummaryDto> GoalsSummary { get; set; } = [];

    public IReadOnlyList<UpcomingRecurringDto> UpcomingRecurring { get; set; } = [];
}

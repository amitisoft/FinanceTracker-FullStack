using FinanceTracker.Application.Dashboard.DTOs;
using FinanceTracker.Application.Dashboard.Queries;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Dashboard.Services;

public class DashboardService : IDashboardService
{
    private readonly IAccountRepository _accountRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IBudgetRepository _budgetRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IGoalRepository _goalRepository;
    private readonly IRecurringTransactionRepository _recurringRepository;

    public DashboardService(
        IAccountRepository accountRepository,
        ITransactionRepository transactionRepository,
        IBudgetRepository budgetRepository,
        ICategoryRepository categoryRepository,
        IGoalRepository goalRepository,
        IRecurringTransactionRepository recurringRepository)
    {
        _accountRepository = accountRepository;
        _transactionRepository = transactionRepository;
        _budgetRepository = budgetRepository;
        _categoryRepository = categoryRepository;
        _goalRepository = goalRepository;
        _recurringRepository = recurringRepository;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, GetDashboardSummaryQuery query)
    {
        if (query.Month < 1 || query.Month > 12)
            throw new DomainException("Month must be between 1 and 12.");

        if (query.Year < 2000 || query.Year > 2100)
            throw new DomainException("Year is invalid.");

        var accounts = await _accountRepository.GetAllByUserIdAsync(userId);
        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);
        var budgets = await _budgetRepository.GetByMonthYearAsync(userId, query.Month, query.Year);
        var categories = await _categoryRepository.GetAllByUserIdAsync(userId, null, true);
        var goals = await _goalRepository.GetAllByUserIdAsync(userId);
        var recurring = await _recurringRepository.GetAllByUserIdAsync(userId);

        var monthTransactions = transactions
            .Where(t => t.TransactionDate.Month == query.Month && t.TransactionDate.Year == query.Year)
            .ToList();

        var incomeTotal = monthTransactions
            .Where(t => string.Equals(t.Type, "income", StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);

        var expenseTotal = monthTransactions
            .Where(t => string.Equals(t.Type, "expense", StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);

        var totalAccountBalance = accounts.Sum(a => a.CurrentBalance);

        var budgetCards = new List<BudgetProgressDto>();

        foreach (var budget in budgets)
        {
            var category = categories.FirstOrDefault(c => c.Id == budget.CategoryId);
            var spent = monthTransactions
                .Where(t =>
                    t.CategoryId == budget.CategoryId &&
                    string.Equals(t.Type, "expense", StringComparison.OrdinalIgnoreCase))
                .Sum(t => t.Amount);

            var remaining = budget.Amount - spent;
            var progress = budget.Amount == 0 ? 0 : Math.Round((spent / budget.Amount) * 100, 2);

            int? triggeredThreshold = null;

            if (progress >= 120)
                triggeredThreshold = 120;
            else if (progress >= 100)
                triggeredThreshold = 100;
            else if (progress >= 80)
                triggeredThreshold = 80;

            budgetCards.Add(new BudgetProgressDto
            {
                BudgetId = budget.Id,
                CategoryId = budget.CategoryId,
                CategoryName = category?.Name ?? "Unknown",
                BudgetAmount = budget.Amount,
                Spent = spent,
                Remaining = remaining,
                ProgressPercent = progress,
                TriggeredThreshold = triggeredThreshold
            });
        }

        var categorySpending = monthTransactions
            .Where(t => string.Equals(t.Type, "expense", StringComparison.OrdinalIgnoreCase) && t.CategoryId.HasValue)
            .GroupBy(t => t.CategoryId!.Value)
            .Select(group =>
            {
                var category = categories.FirstOrDefault(c => c.Id == group.Key);

                return new CategorySpendDto
                {
                    CategoryId = group.Key,
                    CategoryName = category?.Name ?? "Unknown",
                    TotalAmount = group.Sum(x => x.Amount)
                };
            })
            .OrderByDescending(x => x.TotalAmount)
            .Take(8)
            .ToList();

        var recentTransactions = monthTransactions
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t =>
            {
                var account = accounts.FirstOrDefault(a => a.Id == t.AccountId);
                var category = t.CategoryId.HasValue
                    ? categories.FirstOrDefault(c => c.Id == t.CategoryId.Value)
                    : null;

                return new RecentTransactionDto
                {
                    Id = t.Id,
                    Type = t.Type,
                    Amount = t.Amount,
                    Date = t.TransactionDate,
                    Merchant = t.Merchant,
                    Note = t.Note,
                    AccountName = account?.Name ?? "Unknown",
                    CategoryName = category?.Name ?? "Uncategorized"
                };
            })
            .ToList();

        var goalSummaries = goals
            .OrderBy(g => g.Status == "completed" ? 1 : 0)
            .ThenBy(g => g.TargetDate ?? DateTime.MaxValue)
            .ThenBy(g => g.Name)
            .Take(5)
            .Select(g =>
            {
                var progress = g.TargetAmount == 0 ? 0 : Math.Round((g.CurrentAmount / g.TargetAmount) * 100, 2);
                return new GoalSummaryDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    TargetAmount = g.TargetAmount,
                    CurrentAmount = g.CurrentAmount,
                    ProgressPercent = progress,
                    TargetDate = g.TargetDate,
                    Status = g.Status,
                    Icon = g.Icon,
                    Color = g.Color
                };
            })
            .ToList();

        var todayUtc = DateTime.UtcNow.Date;
        var endOfQueryMonth = new DateTime(query.Year, query.Month, DateTime.DaysInMonth(query.Year, query.Month), 0, 0, 0, DateTimeKind.Utc);
        var upcomingRecurring = recurring
            .Where(r => !r.IsPaused && r.NextRunDate.Date >= todayUtc && r.NextRunDate.Date <= endOfQueryMonth.Date)
            .OrderBy(r => r.NextRunDate)
            .ThenBy(r => r.Title)
            .Take(8)
            .Select(r =>
            {
                var accountName = r.AccountId.HasValue
                    ? accounts.FirstOrDefault(a => a.Id == r.AccountId.Value)?.Name
                    : null;
                var categoryName = r.CategoryId.HasValue
                    ? categories.FirstOrDefault(c => c.Id == r.CategoryId.Value)?.Name
                    : null;

                return new UpcomingRecurringDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    Type = r.Type,
                    Amount = r.Amount,
                    NextRunDate = r.NextRunDate,
                    AccountName = accountName,
                    CategoryName = categoryName,
                    AutoCreateTransaction = r.AutoCreateTransaction,
                    IsPaused = r.IsPaused
                };
            })
            .ToList();

        return new DashboardSummaryDto
        {
            Month = query.Month,
            Year = query.Year,
            IncomeTotal = incomeTotal,
            ExpenseTotal = expenseTotal,
            Net = incomeTotal - expenseTotal,
            TotalAccountBalance = totalAccountBalance,
            BudgetProgressCards = budgetCards,
            CategorySpending = categorySpending,
            RecentTransactions = recentTransactions,
            GoalsSummary = goalSummaries,
            UpcomingRecurring = upcomingRecurring
        };
    }
}

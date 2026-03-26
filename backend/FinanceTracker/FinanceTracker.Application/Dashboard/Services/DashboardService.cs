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

    public DashboardService(
        IAccountRepository accountRepository,
        ITransactionRepository transactionRepository,
        IBudgetRepository budgetRepository,
        ICategoryRepository categoryRepository)
    {
        _accountRepository = accountRepository;
        _transactionRepository = transactionRepository;
        _budgetRepository = budgetRepository;
        _categoryRepository = categoryRepository;
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
            GoalsSummary = [],
            UpcomingRecurring = []
        };
    }
}
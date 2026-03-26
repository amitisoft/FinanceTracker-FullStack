using FinanceTracker.Application.Reports.DTOs;
using FinanceTracker.Application.Reports.Queries;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Reports.Services;

public class ReportService : IReportService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IAccountRepository _accountRepository;

    public ReportService(
        ITransactionRepository transactionRepository,
        ICategoryRepository categoryRepository,
        IAccountRepository accountRepository)
    {
        _transactionRepository = transactionRepository;
        _categoryRepository = categoryRepository;
        _accountRepository = accountRepository;
    }

    public async Task<IReadOnlyList<CategorySpendReportItemDto>> GetCategorySpendAsync(Guid userId, GetCategorySpendReportQuery query)
    {
        ValidateDateRange(query.DateFrom, query.DateTo);

        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);
        var categories = await _categoryRepository.GetAllByUserIdAsync(userId, null, true);

        var filtered = transactions
            .Where(t =>
                string.Equals(t.Type, "expense", StringComparison.OrdinalIgnoreCase) &&
                t.TransactionDate.Date >= query.DateFrom.Date &&
                t.TransactionDate.Date <= query.DateTo.Date);

        if (query.AccountId.HasValue)
            filtered = filtered.Where(t => t.AccountId == query.AccountId.Value);

        return filtered
            .Where(t => t.CategoryId.HasValue)
            .GroupBy(t => t.CategoryId!.Value)
            .Select(group =>
            {
                var category = categories.FirstOrDefault(c => c.Id == group.Key);

                return new CategorySpendReportItemDto
                {
                    CategoryId = group.Key,
                    CategoryName = category?.Name ?? "Unknown",
                    TotalAmount = group.Sum(x => x.Amount)
                };
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();
    }

    public async Task<IReadOnlyList<IncomeVsExpenseReportItemDto>> GetIncomeVsExpenseAsync(Guid userId, GetIncomeVsExpenseReportQuery query)
    {
        ValidateDateRange(query.DateFrom, query.DateTo);

        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);

        return transactions
            .Where(t =>
                t.TransactionDate.Date >= query.DateFrom.Date &&
                t.TransactionDate.Date <= query.DateTo.Date &&
                (!query.AccountId.HasValue || t.AccountId == query.AccountId.Value))
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .OrderBy(g => g.Key.Year)
            .ThenBy(g => g.Key.Month)
            .Select(group =>
            {
                var income = group
                    .Where(t => string.Equals(t.Type, "income", StringComparison.OrdinalIgnoreCase))
                    .Sum(t => t.Amount);

                var expense = group
                    .Where(t => string.Equals(t.Type, "expense", StringComparison.OrdinalIgnoreCase))
                    .Sum(t => t.Amount);

                return new IncomeVsExpenseReportItemDto
                {
                    Period = $"{group.Key.Year:D4}-{group.Key.Month:D2}",
                    Income = income,
                    Expense = expense,
                    Net = income - expense
                };
            })
            .ToList();
    }

    public async Task<IReadOnlyList<AccountBalanceTrendItemDto>> GetAccountBalanceTrendAsync(Guid userId, GetAccountBalanceTrendQuery query)
    {
        ValidateDateRange(query.DateFrom, query.DateTo);

        var account = await _accountRepository.GetByIdAsync(query.AccountId, userId);
        if (account is null)
            throw new DomainException("Account not found.");

        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);

        var accountTransactions = transactions
            .Where(t =>
                t.AccountId == query.AccountId &&
                t.TransactionDate.Date >= query.DateFrom.Date &&
                t.TransactionDate.Date <= query.DateTo.Date)
            .OrderBy(t => t.TransactionDate)
            .ThenBy(t => t.CreatedAt)
            .ToList();

        var runningBalance = account.OpeningBalance;
        var result = new List<AccountBalanceTrendItemDto>();

        foreach (var tx in accountTransactions)
        {
            if (string.Equals(tx.Type, "income", StringComparison.OrdinalIgnoreCase))
                runningBalance += tx.Amount;
            else if (string.Equals(tx.Type, "expense", StringComparison.OrdinalIgnoreCase))
                runningBalance -= tx.Amount;

            result.Add(new AccountBalanceTrendItemDto
            {
                Date = tx.TransactionDate,
                Balance = runningBalance
            });
        }

        return result;
    }

    public async Task<TrendsReportDto> GetTrendsAsync(Guid userId, GetTrendsReportQuery query)
    {
        ValidateDateRange(query.DateFrom, query.DateTo);

        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);
        var categories = await _categoryRepository.GetAllByUserIdAsync(userId, null, true);

        var filtered = transactions
            .Where(t => t.TransactionDate.Date >= query.DateFrom.Date && t.TransactionDate.Date <= query.DateTo.Date);

        if (query.AccountId.HasValue)
            filtered = filtered.Where(t => t.AccountId == query.AccountId.Value);

        var grouped = filtered
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .ToList();

        var savingsTrend = grouped.Select(g =>
        {
            var income = g.Where(t => t.Type.Equals("income", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Amount);
            var expense = g.Where(t => t.Type.Equals("expense", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Amount);
            var rate = income == 0 ? 0 : Math.Clamp((income - expense) / income, 0, 1);
            return new TrendPointDto
            {
                Period = $"{g.Key.Year:D4}-{g.Key.Month:D2}",
                Income = income,
                Expense = expense,
                SavingsRate = rate
            };
        }).ToList();

        var categoryTrends = filtered
            .Where(t => t.Type.Equals("expense", StringComparison.OrdinalIgnoreCase) && t.CategoryId.HasValue)
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month, CategoryId = t.CategoryId!.Value })
            .Select(g =>
            {
                var category = categories.FirstOrDefault(c => c.Id == g.Key.CategoryId);
                return new CategoryTrendDto
                {
                    Period = $"{g.Key.Year:D4}-{g.Key.Month:D2}",
                    CategoryId = g.Key.CategoryId,
                    CategoryName = category?.Name ?? "Unknown",
                    TotalAmount = g.Sum(x => x.Amount)
                };
            })
            .OrderBy(x => x.Period)
            .ThenByDescending(x => x.TotalAmount)
            .ToList();

        return new TrendsReportDto
        {
            SavingsRateTrend = savingsTrend,
            CategoryTrends = categoryTrends,
            IncomeVsExpense = await GetIncomeVsExpenseAsync(userId, new GetIncomeVsExpenseReportQuery
            {
                DateFrom = query.DateFrom,
                DateTo = query.DateTo,
                AccountId = query.AccountId
            })
        };
    }

    public async Task<IReadOnlyList<NetWorthPointDto>> GetNetWorthAsync(Guid userId, GetNetWorthReportQuery query)
    {
        ValidateDateRange(query.DateFrom, query.DateTo);

        var accounts = await _accountRepository.GetAllByUserIdAsync(userId);
        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);

        var start = new DateTime(query.DateFrom.Year, query.DateFrom.Month, 1);
        var end = new DateTime(query.DateTo.Year, query.DateTo.Month, 1);

        var points = new List<NetWorthPointDto>();
        var baseBalance = accounts.Sum(a => a.OpeningBalance);

        var txns = transactions
            .Where(t => t.TransactionDate.Date >= query.DateFrom.Date && t.TransactionDate.Date <= query.DateTo.Date)
            .OrderBy(t => t.TransactionDate)
            .ToList();

        var running = baseBalance;
        var idx = 0;
        for (var dt = start; dt <= end; dt = dt.AddMonths(1))
        {
            while (idx < txns.Count && txns[idx].TransactionDate.Date <= dt.AddMonths(1).AddDays(-1))
            {
                if (txns[idx].Type.Equals("income", StringComparison.OrdinalIgnoreCase))
                    running += txns[idx].Amount;
                else if (txns[idx].Type.Equals("expense", StringComparison.OrdinalIgnoreCase))
                    running -= txns[idx].Amount;
                idx++;
            }

            points.Add(new NetWorthPointDto
            {
                Date = dt,
                NetWorth = running
            });
        }

        return points;
    }

    private static void ValidateDateRange(DateTime dateFrom, DateTime dateTo)
    {
        if (dateFrom == default || dateTo == default)
            throw new DomainException("DateFrom and DateTo are required.");

        if (dateFrom.Date > dateTo.Date)
            throw new DomainException("DateFrom cannot be greater than DateTo.");
    }
}

using FinanceTracker.Application.Forecast.DTOs;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Forecast.Services;

public interface IForecastService
{
    Task<MonthlyForecastDto> GetMonthlyAsync(Guid userId, DateTime todayUtc);
    Task<IReadOnlyList<DailyForecastPointDto>> GetDailyAsync(Guid userId, DateTime startUtc, DateTime endUtc);
}

public class ForecastService : IForecastService
{
    private readonly IAccountRepository _accountRepo;
    private readonly ITransactionRepository _txnRepo;
    private readonly IRecurringTransactionRepository _recurringRepo;

    public ForecastService(
        IAccountRepository accountRepo,
        ITransactionRepository txnRepo,
        IRecurringTransactionRepository recurringRepo)
    {
        _accountRepo = accountRepo;
        _txnRepo = txnRepo;
        _recurringRepo = recurringRepo;
    }

    public async Task<MonthlyForecastDto> GetMonthlyAsync(Guid userId, DateTime todayUtc)
    {
        var today = todayUtc.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddSeconds(-1);

        var accounts = await _accountRepo.GetAllByUserIdAsync(userId);
        var txns = await _txnRepo.GetAllByUserIdAsync(userId);
        var recurring = await _recurringRepo.GetAllByUserIdAsync(userId);

        var startingBalance = accounts.Sum(a => a.CurrentBalance);

        var thisMonthTxns = txns.Where(t => t.TransactionDate >= startOfMonth && t.TransactionDate <= today).ToList();
        var incomeActual = SumByType(thisMonthTxns, "income");
        var expenseActual = SumByType(thisMonthTxns, "expense");

        var upcoming = BuildUpcoming(recurring, today, endOfMonth);

        // Pattern-based fallback: average daily income/expense from last 30 days when upcoming is sparse
        var last30 = txns.Where(t => t.TransactionDate >= today.AddDays(-30)).ToList();
        var earliest = last30.Any() ? last30.Min(t => t.TransactionDate.Date) : today;
        var spanDays = Math.Max(1, Math.Min(30, (today - earliest).Days + 1));
        var avgIncome = SumByType(last30, "income") / spanDays;
        var avgExpense = SumByType(last30, "expense") / spanDays;

        var daysLeft = Math.Max(1, (endOfMonth.Date - today).Days + 1);
        if (!upcoming.Any())
        {
            upcoming.Add(new UpcomingItemDto("Projected income", endOfMonth.Date, avgIncome * daysLeft, "income", "average"));
            upcoming.Add(new UpcomingItemDto("Projected expenses", endOfMonth.Date, avgExpense * daysLeft, "expense", "average"));
        }

        var projectedIncome = upcoming.Where(u => IsIncome(u.Type)).Sum(u => u.Amount);
        var projectedExpense = upcoming.Where(u => !IsIncome(u.Type)).Sum(u => u.Amount);

        var projectedEnd = startingBalance + incomeActual - expenseActual + projectedIncome - projectedExpense;
        var daily = BuildDailySeries(today, endOfMonth, startingBalance + incomeActual - expenseActual, projectedIncome, projectedExpense);
        var risk = ComputeRisk(projectedEnd, accounts);

        return new MonthlyForecastDto
        {
            StartingBalance = startingBalance,
            ProjectedEndBalance = projectedEnd,
            TotalIncome = incomeActual + projectedIncome,
            TotalExpense = expenseActual + projectedExpense,
            RiskLevel = risk,
            Upcoming = upcoming.OrderBy(u => u.Date).ToList(),
            Daily = daily.ToList()
        };
    }

    public async Task<IReadOnlyList<DailyForecastPointDto>> GetDailyAsync(Guid userId, DateTime startUtc, DateTime endUtc)
    {
        var month = await GetMonthlyAsync(userId, startUtc);
        return month.Daily.Where(d => d.Date >= startUtc.Date && d.Date <= endUtc.Date).ToList();
    }

    private static decimal SumByType(IEnumerable<Transaction> txns, string type)
    {
        return txns.Where(t => string.Equals(t.Type, type, StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);
    }

    private static List<UpcomingItemDto> BuildUpcoming(IEnumerable<RecurringTransaction> recurring, DateTime today, DateTime endOfMonth)
    {
        var upcoming = new List<UpcomingItemDto>();
        foreach (var r in recurring.Where(r => !r.IsPaused))
        {
            var next = r.NextRunDate.Date;
            while (next <= endOfMonth.Date)
            {
                if (next >= today.Date)
                {
                    upcoming.Add(new UpcomingItemDto(
                        r.Title,
                        next,
                        r.Amount,
                        r.Type,
                        "recurring"));
                }
                next = Advance(next, r.Frequency);
            }
        }
        return upcoming;
    }

    private static DateTime Advance(DateTime date, string frequency)
    {
        return frequency?.ToLowerInvariant() switch
        {
            "weekly" => date.AddDays(7),
            "biweekly" => date.AddDays(14),
            "monthly" => date.AddMonths(1),
            _ => date.AddMonths(1)
        };
    }

    private static IEnumerable<DailyForecastPointDto> BuildDailySeries(
        DateTime today,
        DateTime endOfMonth,
        decimal currentBalance,
        decimal projectedIncome,
        decimal projectedExpense)
    {
        var days = Math.Max(1, (endOfMonth.Date - today.Date).Days + 1);
        var net = projectedIncome - projectedExpense;
        var perDay = net / days;
        var safeToSpendDaily = Math.Max(0, (currentBalance + net) / days);

        var points = new List<DailyForecastPointDto>();
        var running = currentBalance;
        for (var i = 0; i < days; i++)
        {
            var date = today.Date.AddDays(i);
            running += perDay;
            points.Add(new DailyForecastPointDto(date, running, safeToSpendDaily));
        }
        return points;
    }

    private static bool IsIncome(string type) => string.Equals(type, "income", StringComparison.OrdinalIgnoreCase);

    private static string ComputeRisk(decimal projectedEnd, IReadOnlyCollection<Account> accounts)
    {
        var avgDailyBalance = accounts.Count == 0 ? 0 : accounts.Sum(a => a.CurrentBalance) / 30m;
        if (projectedEnd < 0) return "high";
        if (projectedEnd < avgDailyBalance * 5) return "medium";
        return "low";
    }
}

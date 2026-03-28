using FinanceTracker.Application.Insights.DTOs;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Insights.Services;

public interface IHealthScoreService
{
    Task<HealthScoreDto> GetAsync(Guid userId, DateTime asOfUtc);
}

public class HealthScoreService : IHealthScoreService
{
    private readonly IAccountRepository _accountRepo;
    private readonly ITransactionRepository _txnRepo;
    private readonly IBudgetRepository _budgetRepo;

    public HealthScoreService(
        IAccountRepository accountRepo,
        ITransactionRepository txnRepo,
        IBudgetRepository budgetRepo)
    {
        _accountRepo = accountRepo;
        _txnRepo = txnRepo;
        _budgetRepo = budgetRepo;
    }

    public async Task<HealthScoreDto> GetAsync(Guid userId, DateTime asOfUtc)
    {
        var accounts = await _accountRepo.GetAllByUserIdAsync(userId);
        var txns = await _txnRepo.GetAllByUserIdAsync(userId);
        var budgets = await _budgetRepo.GetByMonthYearAsync(userId, asOfUtc.Month, asOfUtc.Year);

        if (txns.Count == 0)
        {
            return new HealthScoreDto
            {
                Score = 0,
                HasData = false,
                Note = "Add a few transactions to calculate your health score.",
                Suggestions = new List<string>
                {
                    "Add your first account and transaction to unlock insights.",
                    "Create a budget for your top spending category for better guidance."
                }
            };
        }

        var last30 = txns.Where(t => t.TransactionDate >= asOfUtc.AddDays(-30)).ToList();
        if (last30.Count == 0)
        {
            return new HealthScoreDto
            {
                Score = 0,
                HasData = false,
                Note = "No transactions in the last 30 days - score needs recent activity.",
                Suggestions = new List<string>
                {
                    "Add a recent transaction to start tracking trends.",
                    "If you imported older data, add at least one transaction this month."
                }
            };
        }

        var income = last30.Where(t => t.Type.Equals("income", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Amount);
        var expense = last30.Where(t => t.Type.Equals("expense", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Amount);
        var savingsRate = income == 0 ? 0 : Math.Clamp((income - expense) / income, 0, 1);

        var expenseStability = ComputeExpenseStability(last30);
        var budgetAdherence = ComputeBudgetAdherence(budgets, last30);
        var buffer = ComputeBufferScore(accounts, expense);

        var score = (int)Math.Round(
            (savingsRate * 0.35m + expenseStability * 0.2m + budgetAdherence * 0.25m + buffer * 0.2m) * 100,
            MidpointRounding.AwayFromZero);

        var suggestions = BuildSuggestions(savingsRate, expenseStability, budgetAdherence, buffer);

        return new HealthScoreDto
        {
            Score = Math.Clamp(score, 0, 100),
            HasData = true,
            Breakdown = new Dictionary<string, decimal>
            {
                ["savingsRate"] = (decimal)savingsRate,
                ["expenseStability"] = expenseStability,
                ["budgetAdherence"] = budgetAdherence,
                ["cashBuffer"] = buffer
            },
            Suggestions = suggestions
        };
    }

    private static decimal ComputeExpenseStability(List<Domain.Entities.Transaction> last30)
    {
        var days = last30.GroupBy(t => t.TransactionDate.Date)
            .Select(g => g.Where(t => t.Type.Equals("expense", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Amount))
            .ToList();
        if (days.Count == 0) return 0.5m;
        var avg = days.Average();
        var variance = days.Average(d => Math.Pow((double)(d - (decimal)avg), 2));
        var std = Math.Sqrt(variance);
        var stability = avg == 0 ? 0.5m : (decimal)Math.Clamp(1 - (std / (double)avg), 0, 1);
        return stability;
    }

    private static decimal ComputeBudgetAdherence(IReadOnlyList<Domain.Entities.Budget> budgets, List<Domain.Entities.Transaction> last30)
    {
        if (budgets.Count == 0) return 0.5m;
        decimal adherenceSum = 0;
        int counted = 0;
        foreach (var b in budgets)
        {
            var spent = last30.Where(t => t.CategoryId == b.CategoryId && t.Type.Equals("expense", StringComparison.OrdinalIgnoreCase))
                .Sum(t => t.Amount);
            if (b.Amount <= 0) continue;
            var ratio = Math.Clamp(spent / b.Amount, 0, 2);
            var adherence = ratio <= 1 ? 1 - ratio * 0.2m : Math.Max(0, 1 - (ratio - 1));
            adherenceSum += adherence;
            counted++;
        }
        return counted == 0 ? 0.5m : adherenceSum / counted;
    }

    private static decimal ComputeBufferScore(IReadOnlyList<Domain.Entities.Account> accounts, decimal expense30)
    {
        var totalBalance = accounts.Sum(a => a.CurrentBalance);
        var dailyExpense = expense30 / 30m;
        if (dailyExpense <= 0) return 1m;
        var days = totalBalance / dailyExpense;
        return Math.Clamp(days / 60m, 0, 1);
    }

    private static List<string> BuildSuggestions(decimal savingsRate, decimal expenseStability, decimal budgetAdherence, decimal buffer)
    {
        var tips = new List<string>();
        if (savingsRate < 0.2m) tips.Add("Increase savings rate - aim for at least 20% of income.");
        if (expenseStability < 0.5m) tips.Add("Smooth expenses - set alerts for spikes and track recurring bills.");
        if (budgetAdherence < 0.6m) tips.Add("Tighten budgets in overshooting categories.");
        if (buffer < 0.5m) tips.Add("Build a cash buffer toward 60 days of expenses.");
        if (!tips.Any()) tips.Add("Great job - keep consistency to maintain your score.");
        return tips;
    }
}

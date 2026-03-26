using FinanceTracker.Application.Insights.DTOs;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Insights.Services;

public interface IInsightsService
{
    Task<IReadOnlyList<InsightMessageDto>> GetInsightsAsync(Guid userId, DateTime asOfUtc);
}

public class InsightsService : IInsightsService
{
    private readonly ITransactionRepository _txnRepo;
    private readonly ICategoryRepository _categoryRepo;

    public InsightsService(ITransactionRepository txnRepo, ICategoryRepository categoryRepo)
    {
        _txnRepo = txnRepo;
        _categoryRepo = categoryRepo;
    }

    public async Task<IReadOnlyList<InsightMessageDto>> GetInsightsAsync(Guid userId, DateTime asOfUtc)
    {
        var txns = await _txnRepo.GetAllByUserIdAsync(userId);
        var categories = await _categoryRepo.GetAllByUserIdAsync(userId, null, true);

        var currentStart = asOfUtc.Date.AddDays(-30);
        var prevStart = asOfUtc.Date.AddDays(-60);
        var prevEnd = asOfUtc.Date.AddDays(-31);

        var current = txns.Where(t => t.TransactionDate.Date >= currentStart && t.TransactionDate.Date <= asOfUtc.Date);
        var previous = txns.Where(t => t.TransactionDate.Date >= prevStart && t.TransactionDate.Date <= prevEnd);

        var insights = new List<InsightMessageDto>();

        var currentSpend = current.Where(t => t.Type.Equals("expense", StringComparison.OrdinalIgnoreCase));
        var prevSpend = previous.Where(t => t.Type.Equals("expense", StringComparison.OrdinalIgnoreCase));

        var currentTotal = currentSpend.Sum(t => t.Amount);
        var prevTotal = prevSpend.Sum(t => t.Amount);
        if (prevTotal > 0)
        {
            var deltaPct = (currentTotal - prevTotal) / prevTotal * 100;
            if (Math.Abs(deltaPct) >= 15)
            {
                insights.Add(new InsightMessageDto
                {
                    Title = "Spending change",
                    Message = $"Your spending changed {deltaPct:F0}% vs last month.",
                    Severity = deltaPct > 0 ? "warning" : "info"
                });
            }
        }

        var byCategory = currentSpend
            .Where(t => t.CategoryId.HasValue)
            .GroupBy(t => t.CategoryId!.Value)
            .Select(g => new { CategoryId = g.Key, Total = g.Sum(x => x.Amount) })
            .OrderByDescending(x => x.Total)
            .ToList();

        if (byCategory.Any())
        {
            var top = byCategory.First();
            var categoryName = categories.FirstOrDefault(c => c.Id == top.CategoryId)?.Name ?? "Unknown";
            insights.Add(new InsightMessageDto
            {
                Title = "Top category",
                Message = $"{categoryName} is your largest spend category at {top.Total:F2}.",
                Severity = "info"
            });
        }

        if (!insights.Any())
        {
            insights.Add(new InsightMessageDto
            {
                Title = "No major changes",
                Message = "Spending patterns are steady. Keep tracking for better insights.",
                Severity = "info"
            });
        }

        return insights;
    }
}

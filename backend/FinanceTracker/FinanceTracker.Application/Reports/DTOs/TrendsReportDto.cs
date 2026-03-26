namespace FinanceTracker.Application.Reports.DTOs;

public class TrendsReportDto
{
    public List<TrendPointDto> SavingsRateTrend { get; set; } = new();
    public List<CategoryTrendDto> CategoryTrends { get; set; } = new();
    public IReadOnlyList<IncomeVsExpenseReportItemDto> IncomeVsExpense { get; set; } = new List<IncomeVsExpenseReportItemDto>();
}

namespace FinanceTracker.Application.Dashboard.DTOs;

public class BudgetProgressDto
{
    public Guid BudgetId { get; set; }

    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public decimal BudgetAmount { get; set; }

    public decimal Spent { get; set; }

    public decimal Remaining { get; set; }

    public decimal ProgressPercent { get; set; }

    public int? TriggeredThreshold { get; set; }
}
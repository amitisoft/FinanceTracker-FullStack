namespace FinanceTracker.Application.Budgets.DTOs;

public class BudgetDto
{
    public Guid Id { get; set; }

    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public int Month { get; set; }

    public int Year { get; set; }

    public decimal Amount { get; set; }

    public int AlertThresholdPercent { get; set; }

    public decimal Spent { get; set; }

    public decimal Remaining { get; set; }

    public decimal ProgressPercent { get; set; }

    public int? TriggeredThreshold { get; set; }
}
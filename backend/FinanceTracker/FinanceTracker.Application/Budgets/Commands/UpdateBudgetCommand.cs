namespace FinanceTracker.Application.Budgets.Commands;

public class UpdateBudgetCommand
{
    public Guid CategoryId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public decimal Amount { get; set; }

    public int AlertThresholdPercent { get; set; } = 80;
}
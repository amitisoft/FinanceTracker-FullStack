namespace FinanceTracker.Domain.Entities;

public class Budget
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid CategoryId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public decimal Amount { get; set; }

    public int AlertThresholdPercent { get; set; } = 80;

    public int LastAlertThresholdSent { get; set; } = 0;

    public User? User { get; set; }

    public Category? Category { get; set; }
}
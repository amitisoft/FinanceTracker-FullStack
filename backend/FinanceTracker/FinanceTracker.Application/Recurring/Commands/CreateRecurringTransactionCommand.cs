namespace FinanceTracker.Application.Recurring.Commands;

public class CreateRecurringTransactionCommand
{
    public string Title { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public Guid? CategoryId { get; set; }

    public Guid? AccountId { get; set; }

    public string Frequency { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool AutoCreateTransaction { get; set; } = true;
}
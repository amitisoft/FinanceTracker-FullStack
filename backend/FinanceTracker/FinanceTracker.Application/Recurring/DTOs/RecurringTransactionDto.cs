namespace FinanceTracker.Application.Recurring.DTOs;

public class RecurringTransactionDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public Guid? CategoryId { get; set; }

    public Guid? AccountId { get; set; }

    public string Frequency { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime NextRunDate { get; set; }

    public bool AutoCreateTransaction { get; set; }

    public bool IsPaused { get; set; }
}
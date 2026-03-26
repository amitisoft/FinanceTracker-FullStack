namespace FinanceTracker.Domain.Entities;

public class RecurringTransaction
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public Guid? CategoryId { get; set; }

    public Guid? AccountId { get; set; }

    public string Frequency { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime NextRunDate { get; set; }

    public bool AutoCreateTransaction { get; set; } = true;

    public bool IsPaused { get; set; } = false;

    public Category? Category { get; set; }

    public Account? Account { get; set; }

    public User? User { get; set; }
}
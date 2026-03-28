namespace FinanceTracker.Application.Dashboard.DTOs;

public class UpcomingRecurringDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime NextRunDate { get; set; }

    public string? AccountName { get; set; }

    public string? CategoryName { get; set; }

    public bool AutoCreateTransaction { get; set; }

    public bool IsPaused { get; set; }
}

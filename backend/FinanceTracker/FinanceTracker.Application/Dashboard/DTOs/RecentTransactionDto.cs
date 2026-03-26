namespace FinanceTracker.Application.Dashboard.DTOs;

public class RecentTransactionDto
{
    public Guid Id { get; set; }

    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string? Merchant { get; set; }

    public string? Note { get; set; }

    public string AccountName { get; set; } = string.Empty;

    public string CategoryName { get; set; } = string.Empty;
}
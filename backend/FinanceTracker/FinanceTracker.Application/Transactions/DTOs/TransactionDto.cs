namespace FinanceTracker.Application.Transactions.DTOs;

public class TransactionDto
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }

    public Guid? DestinationAccountId { get; set; }

    public Guid? CategoryId { get; set; }

    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string? Merchant { get; set; }

    public string? Note { get; set; }

    public string? PaymentMethod { get; set; }

    public List<string> Tags { get; set; } = new();

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

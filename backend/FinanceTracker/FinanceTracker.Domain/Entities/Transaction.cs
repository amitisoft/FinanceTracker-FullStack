namespace FinanceTracker.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid AccountId { get; set; }

    // For "transfer" transactions, this is the destination account.
    public Guid? DestinationAccountId { get; set; }

    public Guid? CategoryId { get; set; }

    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime TransactionDate { get; set; }

    public string? Merchant { get; set; }

    public string? Note { get; set; }

    public string? PaymentMethod { get; set; }

    public Guid? RecurringTransactionId { get; set; }

    public List<string> Tags { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }

    public Account? Account { get; set; }

    public Account? DestinationAccount { get; set; }

    public Category? Category { get; set; }
}

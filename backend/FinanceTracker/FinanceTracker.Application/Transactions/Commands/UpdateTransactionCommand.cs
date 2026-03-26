namespace FinanceTracker.Application.Transactions.Commands;

public class UpdateTransactionCommand
{
    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public Guid AccountId { get; set; }

    public Guid? CategoryId { get; set; }

    public string? Merchant { get; set; }

    public string? Note { get; set; }

    public string? PaymentMethod { get; set; }
}
namespace FinanceTracker.Application.Accounts.Commands;

public class TransferFundsCommand
{
    public Guid SourceAccountId { get; set; }

    public Guid DestinationAccountId { get; set; }

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string? Note { get; set; }

    public string? PaymentMethod { get; set; }
}
namespace FinanceTracker.Application.Accounts.DTOs;

public class TransferResultDto
{
    public Guid SourceAccountId { get; set; }

    public Guid DestinationAccountId { get; set; }

    public decimal Amount { get; set; }

    public decimal SourceAccountBalance { get; set; }

    public decimal DestinationAccountBalance { get; set; }

    public string Message { get; set; } = string.Empty;
}
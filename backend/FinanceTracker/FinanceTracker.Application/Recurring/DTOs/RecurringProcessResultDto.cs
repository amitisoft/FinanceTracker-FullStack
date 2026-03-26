namespace FinanceTracker.Application.Recurring.DTOs;

public class RecurringProcessResultDto
{
    public int ProcessedCount { get; set; }

    public List<Guid> CreatedTransactionIds { get; set; } = [];
}
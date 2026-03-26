namespace FinanceTracker.Application.Reports.Queries;

public class GetAccountBalanceTrendQuery
{
    public Guid AccountId { get; set; }

    public DateTime DateFrom { get; set; }

    public DateTime DateTo { get; set; }
}


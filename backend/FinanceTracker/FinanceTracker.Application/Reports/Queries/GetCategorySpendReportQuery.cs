namespace FinanceTracker.Application.Reports.Queries;

public class GetCategorySpendReportQuery
{
    public DateTime DateFrom { get; set; }

    public DateTime DateTo { get; set; }

    public Guid? AccountId { get; set; }
}
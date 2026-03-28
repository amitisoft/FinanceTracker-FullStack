namespace FinanceTracker.Application.Transactions.Queries;

public class GetTransactionsQuery
{
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public Guid? AccountId { get; set; }
    public Guid? CategoryId { get; set; }
    public string? Type { get; set; }
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

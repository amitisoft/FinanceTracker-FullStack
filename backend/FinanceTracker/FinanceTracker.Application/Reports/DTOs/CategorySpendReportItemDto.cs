namespace FinanceTracker.Application.Reports.DTOs;

public class CategorySpendReportItemDto
{
    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }
}

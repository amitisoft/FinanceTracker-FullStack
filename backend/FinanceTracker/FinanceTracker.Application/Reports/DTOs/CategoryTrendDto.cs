namespace FinanceTracker.Application.Reports.DTOs;

public class CategoryTrendDto
{
    public string Period { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}

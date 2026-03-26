namespace FinanceTracker.Application.Dashboard.DTOs;

public class CategorySpendDto
{
    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }
}
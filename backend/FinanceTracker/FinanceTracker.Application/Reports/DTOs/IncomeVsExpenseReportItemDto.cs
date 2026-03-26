
namespace FinanceTracker.Application.Reports.DTOs;

public class IncomeVsExpenseReportItemDto
{
    public string Period { get; set; } = string.Empty;

    public decimal Income { get; set; }

    public decimal Expense { get; set; }

    public decimal Net { get; set; }
}
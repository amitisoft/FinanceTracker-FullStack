namespace FinanceTracker.Application.Forecast.DTOs;

public class MonthlyForecastDto
{
    public decimal StartingBalance { get; set; }
    public decimal ProjectedEndBalance { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public string RiskLevel { get; set; } = "low";
    public List<UpcomingItemDto> Upcoming { get; set; } = new();
    public List<DailyForecastPointDto> Daily { get; set; } = new();
}

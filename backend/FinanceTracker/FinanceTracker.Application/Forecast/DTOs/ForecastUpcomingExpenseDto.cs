namespace FinanceTracker.Application.Forecast.DTOs;

public class ForecastUpcomingExpenseDto
{
    public string Title { get; set; } = string.Empty;

    public DateTime Date { get; set; }

    public decimal Amount { get; set; }

    public string Source { get; set; } = string.Empty;
}
namespace FinanceTracker.Application.Forecast.DTOs;

public class ForecastMonthDto
{
    public decimal CurrentBalance { get; set; }

    public decimal ForecastedEndOfMonthBalance { get; set; }

    public decimal SafeToSpend { get; set; }

    public string Confidence { get; set; } = "low";

    public List<ForecastUpcomingExpenseDto> UpcomingExpenses { get; set; } = [];

    public List<string> RiskWarnings { get; set; } = [];
}
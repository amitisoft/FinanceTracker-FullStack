namespace FinanceTracker.Application.Forecast.DTOs;

public record DailyForecastPointDto(DateTime Date, decimal ProjectedBalance, decimal SafeToSpend);

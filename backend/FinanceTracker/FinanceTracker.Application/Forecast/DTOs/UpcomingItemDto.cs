namespace FinanceTracker.Application.Forecast.DTOs;

public record UpcomingItemDto(string Title, DateTime Date, decimal Amount, string Type, string Source);

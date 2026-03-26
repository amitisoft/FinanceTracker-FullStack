namespace FinanceTracker.Application.Insights.DTOs;

public class InsightMessageDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
}

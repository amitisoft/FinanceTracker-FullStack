namespace FinanceTracker.Application.Insights.DTOs;

public class HealthScoreDto
{
    public int Score { get; set; }
    public bool HasData { get; set; } = true;
    public string? Note { get; set; }
    public Dictionary<string, decimal> Breakdown { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}

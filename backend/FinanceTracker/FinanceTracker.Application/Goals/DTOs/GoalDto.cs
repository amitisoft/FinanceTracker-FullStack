namespace FinanceTracker.Application.Goals.DTOs;

public class GoalDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }

    public decimal CurrentAmount { get; set; }

    public decimal ProgressPercent { get; set; }

    public DateTime? TargetDate { get; set; }

    public Guid? LinkedAccountId { get; set; }

    public string? Icon { get; set; }

    public string? Color { get; set; }

    public string Status { get; set; } = string.Empty;
}
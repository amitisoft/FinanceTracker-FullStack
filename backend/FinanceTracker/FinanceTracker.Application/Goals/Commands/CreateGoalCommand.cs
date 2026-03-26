namespace FinanceTracker.Application.Goals.Commands;

public class CreateGoalCommand
{
    public string Name { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }

    public decimal CurrentAmount { get; set; }

    public DateTime? TargetDate { get; set; }

    public Guid? LinkedAccountId { get; set; }

    public string? Icon { get; set; }

    public string? Color { get; set; }
}
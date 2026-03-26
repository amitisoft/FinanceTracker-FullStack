namespace FinanceTracker.Application.Goals.Commands;

public class GoalContributionCommand
{
    public decimal Amount { get; set; }

    public Guid? SourceAccountId { get; set; }
}
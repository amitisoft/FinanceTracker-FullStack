namespace FinanceTracker.Application.Goals.Commands;

public class GoalWithdrawCommand
{
    public decimal Amount { get; set; }

    public Guid? DestinationAccountId { get; set; }
}
namespace FinanceTracker.Application.Demo.DTOs;

public class DemoSeedResultDto
{
    public bool AlreadySeeded { get; set; }

    public int AccountsCreated { get; set; }

    public int TransactionsCreated { get; set; }

    public int BudgetsCreated { get; set; }

    public int GoalsCreated { get; set; }

    public int RecurringCreated { get; set; }

    public int RulesCreated { get; set; }

    public string Message { get; set; } = string.Empty;
}

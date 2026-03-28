namespace FinanceTracker.Application.Demo.DTOs;

public class DemoClearResultDto
{
    public bool Cleared { get; set; }

    public int AccountsDeleted { get; set; }

    public int TransactionsDeleted { get; set; }

    public int BudgetsDeleted { get; set; }

    public int GoalsDeleted { get; set; }

    public int RecurringDeleted { get; set; }

    public int RulesDeleted { get; set; }

    public string Message { get; set; } = string.Empty;
}


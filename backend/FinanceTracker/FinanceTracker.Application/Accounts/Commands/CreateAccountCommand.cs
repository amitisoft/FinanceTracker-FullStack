namespace FinanceTracker.Application.Accounts.Commands;

public class CreateAccountCommand
{
    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal OpeningBalance { get; set; }

    public string? InstitutionName { get; set; }
}
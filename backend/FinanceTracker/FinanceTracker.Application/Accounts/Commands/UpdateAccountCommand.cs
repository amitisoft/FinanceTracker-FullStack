namespace FinanceTracker.Application.Accounts.Commands;

public class UpdateAccountCommand
{
    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string? InstitutionName { get; set; }
}

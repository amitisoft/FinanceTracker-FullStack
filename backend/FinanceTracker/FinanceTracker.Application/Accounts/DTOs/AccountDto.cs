namespace FinanceTracker.Application.Accounts.DTOs;

public class AccountDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal OpeningBalance { get; set; }

    public decimal CurrentBalance { get; set; }

    public string? InstitutionName { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime LastUpdatedAt { get; set; }
}
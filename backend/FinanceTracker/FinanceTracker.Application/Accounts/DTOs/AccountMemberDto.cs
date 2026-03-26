namespace FinanceTracker.Application.Accounts.DTOs;

public class AccountMemberDto
{
    public Guid UserId { get; set; }
    public string Role { get; set; } = "viewer";
    public bool IsActive { get; set; }
}

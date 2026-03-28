namespace FinanceTracker.Application.Accounts.DTOs;

public class AccountMemberDto
{
    public Guid UserId { get; set; }
    public string Role { get; set; } = "viewer";
    public bool IsActive { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool IsOwner { get; set; }
}

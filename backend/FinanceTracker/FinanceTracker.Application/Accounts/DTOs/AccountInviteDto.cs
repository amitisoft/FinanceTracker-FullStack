namespace FinanceTracker.Application.Accounts.DTOs;

public class AccountInviteDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "viewer";
    public string Status { get; set; } = "pending";
    public DateTime ExpiresAt { get; set; }
}

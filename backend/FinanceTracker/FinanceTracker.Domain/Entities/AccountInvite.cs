namespace FinanceTracker.Domain.Entities;

public class AccountInvite
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "viewer";
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, accepted, expired, cancelled
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Account? Account { get; set; }
}

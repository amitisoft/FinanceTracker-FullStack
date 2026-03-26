namespace FinanceTracker.Domain.Entities;

public class AccountMember
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "viewer"; // owner, editor, viewer
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Account? Account { get; set; }
    public User? User { get; set; }
}

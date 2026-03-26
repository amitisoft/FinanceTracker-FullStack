namespace FinanceTracker.Domain.Entities;

public class AccountActivity
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty; // created/updated/deleted
    public string EntityType { get; set; } = string.Empty; // transaction, budget, goal
    public Guid EntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Account? Account { get; set; }
    public User? User { get; set; }
}

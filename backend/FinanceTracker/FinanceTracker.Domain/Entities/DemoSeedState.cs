namespace FinanceTracker.Domain.Entities;

public class DemoSeedState
{
    public Guid UserId { get; set; }

    public DateTime SeededAtUtc { get; set; }

    public string PayloadJson { get; set; } = string.Empty;

    public User? User { get; set; }
}


namespace FinanceTracker.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string? Color { get; set; }

    public string? Icon { get; set; }

    public bool IsArchived { get; set; }

    public User? User { get; set; }
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public ICollection<RecurringTransaction> RecurringTransactions { get; set; } = new List<RecurringTransaction>();
}
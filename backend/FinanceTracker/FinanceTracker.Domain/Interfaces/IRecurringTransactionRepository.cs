using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IRecurringTransactionRepository
{
    Task AddAsync(RecurringTransaction recurringTransaction);

    Task<RecurringTransaction?> GetByIdAsync(Guid id, Guid userId);

    Task<IReadOnlyList<RecurringTransaction>> GetAllByUserIdAsync(Guid userId);

    Task<IReadOnlyList<RecurringTransaction>> GetDueAsync(Guid userId, DateTime asOfDate);

    void Remove(RecurringTransaction recurringTransaction);

    Task SaveChangesAsync();
}
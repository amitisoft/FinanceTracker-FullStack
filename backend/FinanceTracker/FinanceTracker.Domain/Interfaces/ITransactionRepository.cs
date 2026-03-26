using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction);

    Task<Transaction?> GetByIdAsync(Guid id, Guid userId);

    Task<IReadOnlyList<Transaction>> GetAllByUserIdAsync(Guid userId);

    void Remove(Transaction transaction);

    Task SaveChangesAsync();
}
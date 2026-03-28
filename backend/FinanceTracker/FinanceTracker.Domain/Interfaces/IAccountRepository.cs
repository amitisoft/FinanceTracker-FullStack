using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IAccountRepository
{
    Task AddAsync(Account account);

    Task<Account?> GetByIdAsync(Guid id, Guid userId);
    Task<Account?> GetByIdAsync(Guid id);

    Task<IReadOnlyList<Account>> GetAllByUserIdAsync(Guid userId);

    void Remove(Account account);

    Task SaveChangesAsync();
}

using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IAccountRepository
{
    Task AddAsync(Account account);

    Task<Account?> GetByIdAsync(Guid id, Guid userId);

    Task<IReadOnlyList<Account>> GetAllByUserIdAsync(Guid userId);

    Task SaveChangesAsync();
}
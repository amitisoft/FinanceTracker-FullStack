using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IAccountActivityRepository
{
    Task AddAsync(AccountActivity activity);
    Task SaveChangesAsync();
}

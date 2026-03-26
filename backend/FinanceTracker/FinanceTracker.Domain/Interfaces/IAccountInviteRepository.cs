using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IAccountInviteRepository
{
    Task AddAsync(AccountInvite invite);
    Task<IReadOnlyList<AccountInvite>> GetByAccountIdAsync(Guid accountId);
    Task SaveChangesAsync();
}

using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IAccountInviteRepository
{
    Task AddAsync(AccountInvite invite);
    Task<IReadOnlyList<AccountInvite>> GetByAccountIdAsync(Guid accountId);
    Task<AccountInvite?> GetPendingByAccountAndEmailAsync(Guid accountId, string email);
    Task<IReadOnlyList<AccountInvite>> GetPendingByEmailAsync(string email);
    Task SaveChangesAsync();
}

using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IAccountMemberRepository
{
    Task AddAsync(AccountMember member);
    Task<AccountMember?> GetByUserAndAccountAsync(Guid userId, Guid accountId);
    Task<IReadOnlyList<AccountMember>> GetByAccountIdAsync(Guid accountId);
    Task<IReadOnlyList<Guid>> GetAccountIdsForUserAsync(Guid userId);
    Task SaveChangesAsync();
}

using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class AccountMemberRepository : IAccountMemberRepository
{
    private readonly FinanceTrackerDbContext _db;

    public AccountMemberRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(AccountMember member)
    {
        await _db.AccountMembers.AddAsync(member);
    }

    public async Task<AccountMember?> GetByUserAndAccountAsync(Guid userId, Guid accountId)
    {
        return await _db.AccountMembers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.AccountId == accountId && m.IsActive);
    }

    public async Task<IReadOnlyList<AccountMember>> GetByAccountIdAsync(Guid accountId)
    {
        return await _db.AccountMembers
            .Include(m => m.User)
            .Where(m => m.AccountId == accountId && m.IsActive)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Guid>> GetAccountIdsForUserAsync(Guid userId)
    {
        return await _db.AccountMembers
            .Where(m => m.UserId == userId && m.IsActive)
            .Select(m => m.AccountId)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

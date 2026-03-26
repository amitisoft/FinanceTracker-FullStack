using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class AccountInviteRepository : IAccountInviteRepository
{
    private readonly FinanceTrackerDbContext _db;

    public AccountInviteRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(AccountInvite invite)
    {
        await _db.AccountInvites.AddAsync(invite);
    }

    public async Task<IReadOnlyList<AccountInvite>> GetByAccountIdAsync(Guid accountId)
    {
        return await _db.AccountInvites
            .Where(i => i.AccountId == accountId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

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

    public async Task<AccountInvite?> GetPendingByAccountAndEmailAsync(Guid accountId, string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        return await _db.AccountInvites
            .FirstOrDefaultAsync(i =>
                i.AccountId == accountId &&
                i.Email == normalizedEmail &&
                i.Status == "pending" &&
                i.ExpiresAt > now);
    }

    public async Task<IReadOnlyList<AccountInvite>> GetPendingByEmailAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        return await _db.AccountInvites
            .Include(i => i.Account)
            .Where(i => i.Email == normalizedEmail && i.Status == "pending" && i.ExpiresAt > now)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

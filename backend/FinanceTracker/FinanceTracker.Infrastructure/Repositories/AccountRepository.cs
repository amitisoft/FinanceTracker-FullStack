using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly FinanceTrackerDbContext _db;

    public AccountRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Account account)
    {
        await _db.Accounts.AddAsync(account);
    }

    public async Task<Account?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
    }

    public async Task<IReadOnlyList<Account>> GetAllByUserIdAsync(Guid userId)
    {
        return await _db.Accounts
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.Name)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;

namespace FinanceTracker.Infrastructure.Repositories;

public class AccountActivityRepository : IAccountActivityRepository
{
    private readonly FinanceTrackerDbContext _db;

    public AccountActivityRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(AccountActivity activity)
    {
        await _db.AccountActivities.AddAsync(activity);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

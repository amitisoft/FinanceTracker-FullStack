using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class DemoSeedStateRepository : IDemoSeedStateRepository
{
    private readonly FinanceTrackerDbContext _db;

    public DemoSeedStateRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task<DemoSeedState?> GetByUserIdAsync(Guid userId)
    {
        return await _db.Set<DemoSeedState>()
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task UpsertAsync(DemoSeedState state)
    {
        var existing = await GetByUserIdAsync(state.UserId);
        if (existing is null)
        {
            await _db.Set<DemoSeedState>().AddAsync(state);
            return;
        }

        existing.SeededAtUtc = state.SeededAtUtc;
        existing.PayloadJson = state.PayloadJson;
    }

    public void Remove(DemoSeedState state)
    {
        _db.Set<DemoSeedState>().Remove(state);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}


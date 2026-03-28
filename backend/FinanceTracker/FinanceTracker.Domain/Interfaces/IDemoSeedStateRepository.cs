using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IDemoSeedStateRepository
{
    Task<DemoSeedState?> GetByUserIdAsync(Guid userId);

    Task UpsertAsync(DemoSeedState state);

    void Remove(DemoSeedState state);

    Task SaveChangesAsync();
}


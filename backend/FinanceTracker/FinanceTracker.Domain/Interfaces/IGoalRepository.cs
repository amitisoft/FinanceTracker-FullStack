using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IGoalRepository
{
    Task AddAsync(Goal goal);

    Task<Goal?> GetByIdAsync(Guid id, Guid userId);

    Task<IReadOnlyList<Goal>> GetAllByUserIdAsync(Guid userId);

    void Remove(Goal goal);

    Task SaveChangesAsync();
}

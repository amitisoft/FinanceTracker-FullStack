using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IRuleRepository
{
    Task AddAsync(Rule rule);
    Task<Rule?> GetByIdAsync(Guid id, Guid userId);
    Task<IReadOnlyList<Rule>> GetAllByUserIdAsync(Guid userId);
    void Remove(Rule rule);
    Task SaveChangesAsync();
}

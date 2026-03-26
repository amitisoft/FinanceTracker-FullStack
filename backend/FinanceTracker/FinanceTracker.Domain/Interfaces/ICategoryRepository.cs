using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface ICategoryRepository
{
    Task AddAsync(Category category);

    Task AddRangeAsync(IEnumerable<Category> categories);

    Task<Category?> GetByIdAsync(Guid id, Guid userId);

    Task<IReadOnlyList<Category>> GetAllByUserIdAsync(Guid userId, string? type, bool includeArchived);

    Task<bool> ExistsByUserIdAndNameAndTypeAsync(Guid userId, string name, string type, Guid? excludeId = null);

    Task SaveChangesAsync();
}
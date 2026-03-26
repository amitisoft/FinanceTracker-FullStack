using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IBudgetRepository
{
    Task AddAsync(Budget budget);

    Task<Budget?> GetByIdAsync(Guid id, Guid userId);

    Task<Budget?> GetByCategoryMonthYearAsync(Guid userId, Guid categoryId, int month, int year, Guid? excludeId = null);

    Task<IReadOnlyList<Budget>> GetByMonthYearAsync(Guid userId, int month, int year);

    void Remove(Budget budget);

    Task SaveChangesAsync();
}
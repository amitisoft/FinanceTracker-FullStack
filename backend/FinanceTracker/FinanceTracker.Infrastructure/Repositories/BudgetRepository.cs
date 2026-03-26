using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class BudgetRepository : IBudgetRepository
{
    private readonly FinanceTrackerDbContext _db;

    public BudgetRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Budget budget)
    {
        await _db.Budgets.AddAsync(budget);
    }

    public async Task<Budget?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Budgets
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
    }

    public async Task<Budget?> GetByCategoryMonthYearAsync(Guid userId, Guid categoryId, int month, int year, Guid? excludeId = null)
    {
        IQueryable<Budget> query = _db.Budgets.Where(b =>
            b.UserId == userId &&
            b.CategoryId == categoryId &&
            b.Month == month &&
            b.Year == year);

        if (excludeId.HasValue)
            query = query.Where(b => b.Id != excludeId.Value);

        return await query.FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyList<Budget>> GetByMonthYearAsync(Guid userId, int month, int year)
    {
        return await _db.Budgets
            .Where(b => b.UserId == userId && b.Month == month && b.Year == year)
            .OrderBy(b => b.CategoryId)
            .ToListAsync();
    }

    public void Remove(Budget budget)
    {
        _db.Budgets.Remove(budget);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
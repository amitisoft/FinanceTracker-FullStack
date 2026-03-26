using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly FinanceTrackerDbContext _db;

    public CategoryRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Category category)
    {
        await _db.Categories.AddAsync(category);
    }

    public async Task AddRangeAsync(IEnumerable<Category> categories)
    {
        await _db.Categories.AddRangeAsync(categories);
    }

    public async Task<Category?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    }

    public async Task<IReadOnlyList<Category>> GetAllByUserIdAsync(Guid userId, string? type, bool includeArchived)
    {
        IQueryable<Category> query = _db.Categories
            .Where(c => c.UserId == userId);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(c => c.Type == type);

        if (!includeArchived)
            query = query.Where(c => !c.IsArchived);

        return await query
            .OrderBy(c => c.Type)
            .ThenBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<bool> ExistsByUserIdAndNameAndTypeAsync(Guid userId, string name, string type, Guid? excludeId = null)
    {
        IQueryable<Category> query = _db.Categories
            .Where(c => c.UserId == userId && c.Type == type);

        if (excludeId.HasValue)
            query = query.Where(c => c.Id != excludeId.Value);

        return await query.AnyAsync(c => EF.Functions.ILike(c.Name, name));
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
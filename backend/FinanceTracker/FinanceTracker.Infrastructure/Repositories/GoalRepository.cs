using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class GoalRepository : IGoalRepository
{
    private readonly FinanceTrackerDbContext _db;

    public GoalRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Goal goal)
    {
        await _db.Goals.AddAsync(goal);
    }

    public async Task<Goal?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Goals
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
    }

    public async Task<IReadOnlyList<Goal>> GetAllByUserIdAsync(Guid userId)
    {
        return await _db.Goals
            .Where(g => g.UserId == userId)
            .OrderBy(g => g.Name)
            .ToListAsync();
    }

    public void Remove(Goal goal)
    {
        _db.Goals.Remove(goal);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

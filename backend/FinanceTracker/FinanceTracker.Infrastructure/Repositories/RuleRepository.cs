using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class RuleRepository : IRuleRepository
{
    private readonly FinanceTrackerDbContext _db;

    public RuleRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Rule rule)
    {
        await _db.Rules.AddAsync(rule);
    }

    public async Task<Rule?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Rules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
    }

    public async Task<IReadOnlyList<Rule>> GetAllByUserIdAsync(Guid userId)
    {
        return await _db.Rules
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public void Remove(Rule rule)
    {
        _db.Rules.Remove(rule);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class RecurringTransactionRepository : IRecurringTransactionRepository
{
    private readonly FinanceTrackerDbContext _db;

    public RecurringTransactionRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(RecurringTransaction recurringTransaction)
    {
        await _db.RecurringTransactions.AddAsync(recurringTransaction);
    }

    public async Task<RecurringTransaction?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.RecurringTransactions
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
    }

    public async Task<IReadOnlyList<RecurringTransaction>> GetAllByUserIdAsync(Guid userId)
    {
        return await _db.RecurringTransactions
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.NextRunDate)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<RecurringTransaction>> GetDueAsync(Guid userId, DateTime asOfDate)
    {
        return await _db.RecurringTransactions
            .Where(r =>
                r.UserId == userId &&
                !r.IsPaused &&
                r.NextRunDate.Date <= asOfDate.Date)
            .OrderBy(r => r.NextRunDate)
            .ToListAsync();
    }

    public void Remove(RecurringTransaction recurringTransaction)
    {
        _db.RecurringTransactions.Remove(recurringTransaction);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
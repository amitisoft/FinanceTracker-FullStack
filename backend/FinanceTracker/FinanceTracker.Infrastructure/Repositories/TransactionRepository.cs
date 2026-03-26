using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly FinanceTrackerDbContext _db;

    public TransactionRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Transaction transaction)
    {
        await _db.Transactions.AddAsync(transaction);
    }

    public async Task<Transaction?> GetByIdAsync(Guid id, Guid userId)
    {
        var sharedAccountIds = _db.AccountMembers
            .Where(m => m.UserId == userId && m.IsActive)
            .Select(m => m.AccountId);

        return await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && (t.UserId == userId || sharedAccountIds.Contains(t.AccountId)));
    }

    public async Task<IReadOnlyList<Transaction>> GetAllByUserIdAsync(Guid userId)
    {
        var sharedAccountIds = _db.AccountMembers
            .Where(m => m.UserId == userId && m.IsActive)
            .Select(m => m.AccountId);

        return await _db.Transactions
            .Where(t => t.UserId == userId || sharedAccountIds.Contains(t.AccountId))
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public void Remove(Transaction transaction)
    {
        _db.Transactions.Remove(transaction);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

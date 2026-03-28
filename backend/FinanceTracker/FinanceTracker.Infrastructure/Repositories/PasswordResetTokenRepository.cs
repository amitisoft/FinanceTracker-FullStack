using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly FinanceTrackerDbContext _db;

    public PasswordResetTokenRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(PasswordResetToken token)
    {
        await _db.PasswordResetTokens.AddAsync(token);
    }

    public async Task<PasswordResetToken?> GetByTokenAsync(string token)
    {
        return await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == token);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

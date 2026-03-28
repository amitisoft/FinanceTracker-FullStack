using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Repositories;

public class EmailVerificationTokenRepository : IEmailVerificationTokenRepository
{
    private readonly FinanceTrackerDbContext _db;

    public EmailVerificationTokenRepository(FinanceTrackerDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(EmailVerificationToken token)
    {
        await _db.EmailVerificationTokens.AddAsync(token);
    }

    public async Task<EmailVerificationToken?> GetByTokenAsync(string token)
    {
        return await _db.EmailVerificationTokens.FirstOrDefaultAsync(t => t.Token == token);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}


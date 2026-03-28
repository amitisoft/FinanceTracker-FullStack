using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);

    Task AddAsync(User user);

    Task<bool> EmailExistsAsync(string email);

    Task SaveChangesAsync();
}

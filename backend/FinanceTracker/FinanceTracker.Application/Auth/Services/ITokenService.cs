using FinanceTracker.Domain.Entities;

namespace FinanceTracker.Application.Auth.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    RefreshToken GenerateRefreshToken(Guid userId);
}
namespace FinanceTracker.Application.Auth.Services;

using FinanceTracker.Application.Auth.Commands;
using FinanceTracker.Application.Auth.DTOs;

public interface IAuthService
{
    Task RegisterAsync(RegisterUserCommand command);

    Task<AuthResponse> LoginAsync(LoginCommand command);
}
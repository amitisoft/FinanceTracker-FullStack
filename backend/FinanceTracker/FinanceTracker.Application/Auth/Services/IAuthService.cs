namespace FinanceTracker.Application.Auth.Services;

using FinanceTracker.Application.Auth.Commands;
using FinanceTracker.Application.Auth.DTOs;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(RegisterUserCommand command);

    Task<AuthResponse> LoginAsync(LoginCommand command);

    Task<AuthResponse> RefreshAsync(RefreshTokenCommand command);

    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordCommand command);

    Task ResetPasswordAsync(ResetPasswordCommand command);

    Task<VerifyEmailResponseDto> VerifyEmailAsync(string token);

    Task<ResendVerificationResponseDto> ResendVerificationAsync(string email);
}

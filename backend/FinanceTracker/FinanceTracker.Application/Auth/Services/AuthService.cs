using System.Net.Mail;
using FinanceTracker.Application.Auth.Commands;
using FinanceTracker.Application.Auth.DTOs;
using FinanceTracker.Application.Categories.Services;
using FinanceTracker.Application.Security;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ICategoryService _categoryService;
    private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;

    public AuthService(
        IUserRepository userRepository,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepository,
        ICategoryService categoryService,
        IPasswordResetTokenRepository passwordResetTokenRepository)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _refreshTokenRepository = refreshTokenRepository;
        _categoryService = categoryService;
        _passwordResetTokenRepository = passwordResetTokenRepository;
    }

    public async Task RegisterAsync(RegisterUserCommand command)
    {
        var email = command.Email?.Trim() ?? string.Empty;
        var password = command.Password ?? string.Empty;
        var displayName = string.IsNullOrWhiteSpace(command.DisplayName)
            ? null
            : command.DisplayName.Trim();

        if (!IsValidEmail(email))
            throw new DomainException("A valid email address is required.");

        if (!IsValidPassword(password))
            throw new DomainException("Password must be at least 8 characters and include uppercase, lowercase, and a number.");

        var exists = await _userRepository.EmailExistsAsync(email);

        if (exists)
            throw new DomainException("Email already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = PasswordHasher.Hash(password),
            DisplayName = displayName,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        await _categoryService.SeedDefaultsAsync(user.Id);
    }

    public async Task<AuthResponse> LoginAsync(LoginCommand command)
    {
        var email = command.Email?.Trim() ?? string.Empty;
        var password = command.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            throw new DomainException("Email and password are required.");

        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null || !PasswordHasher.Verify(password, user.PasswordHash))
            throw new DomainException("Invalid email or password.");

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);

        await _refreshTokenRepository.AddAsync(refreshToken);
        await _refreshTokenRepository.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
    }

    public async Task<AuthResponse> RefreshAsync(RefreshTokenCommand command)
    {
        var token = command.RefreshToken?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(token))
            throw new DomainException("Refresh token is required.");

        var existing = await _refreshTokenRepository.GetByTokenAsync(token);
        if (existing is null || existing.IsRevoked || existing.ExpiresAt < DateTime.UtcNow)
            throw new DomainException("Invalid or expired refresh token.");

        var user = await _userRepository.GetByIdAsync(existing.UserId);
        if (user is null)
            throw new DomainException("User not found.");

        existing.IsRevoked = true;

        var accessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken(user.Id);

        await _refreshTokenRepository.AddAsync(newRefreshToken);
        await _refreshTokenRepository.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken.Token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordCommand command)
    {
        var email = command.Email?.Trim() ?? string.Empty;
        if (!IsValidEmail(email))
            throw new DomainException("A valid email address is required.");

        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            // Do not reveal existence; return generic response
            return new ForgotPasswordResponse
            {
                Message = "If the email exists, a reset link has been generated."
            };
        }

        var token = Guid.NewGuid().ToString("N");
        var reset = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            CreatedAt = DateTime.UtcNow
        };

        await _passwordResetTokenRepository.AddAsync(reset);
        await _passwordResetTokenRepository.SaveChangesAsync();

        // Hackathon mode: return token in response (no email integration)
        return new ForgotPasswordResponse
        {
            Message = "Reset token generated.",
            ResetToken = token,
            ExpiresAt = reset.ExpiresAt
        };
    }

    public async Task ResetPasswordAsync(ResetPasswordCommand command)
    {
        var token = command.Token?.Trim() ?? string.Empty;
        var newPassword = command.NewPassword ?? string.Empty;

        if (string.IsNullOrWhiteSpace(token))
            throw new DomainException("Reset token is required.");

        if (!IsValidPassword(newPassword))
            throw new DomainException("Password must be at least 8 characters and include uppercase, lowercase, and a number.");

        var reset = await _passwordResetTokenRepository.GetByTokenAsync(token);
        if (reset is null || reset.UsedAt != null || reset.ExpiresAt < DateTime.UtcNow)
            throw new DomainException("Invalid or expired reset token.");

        var user = await _userRepository.GetByIdAsync(reset.UserId);
        if (user is null)
            throw new DomainException("User not found.");

        user.PasswordHash = PasswordHasher.Hash(newPassword);
        reset.UsedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();
        await _passwordResetTokenRepository.SaveChangesAsync();
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var mailAddress = new MailAddress(email);
            return mailAddress.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private static bool IsValidPassword(string password)
    {
        return password.Length >= 8
            && password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit);
    }
}

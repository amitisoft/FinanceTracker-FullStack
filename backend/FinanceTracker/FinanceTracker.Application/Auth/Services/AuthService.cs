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

    public AuthService(
        IUserRepository userRepository,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepository,
        ICategoryService categoryService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _refreshTokenRepository = refreshTokenRepository;
        _categoryService = categoryService;
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
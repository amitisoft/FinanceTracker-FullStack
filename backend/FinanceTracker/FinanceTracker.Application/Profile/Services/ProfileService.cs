using System.Text.RegularExpressions;
using FinanceTracker.Application.Profile.Commands;
using FinanceTracker.Application.Profile.DTOs;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Profile.Services;

public class ProfileService : IProfileService
{
    private static readonly Regex HexColorRegex = new("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", RegexOptions.Compiled);

    private readonly IUserRepository _users;

    public ProfileService(IUserRepository users)
    {
        _users = users;
    }

    public async Task<UserProfileDto> GetAsync(Guid userId)
    {
        var user = await _users.GetByIdAsync(userId) ?? throw new DomainException("User not found.");
        return Map(user);
    }

    public async Task<UserProfileDto> UpdateAsync(Guid userId, UpdateProfileCommand command)
    {
        var user = await _users.GetByIdAsync(userId) ?? throw new DomainException("User not found.");

        var displayName = command.DisplayName?.Trim();
        if (displayName == string.Empty) displayName = null;
        if (displayName is not null && displayName.Length > 60)
            throw new DomainException("Display name must be 60 characters or less.");

        var avatarUrl = command.AvatarUrl?.Trim();
        if (avatarUrl == string.Empty) avatarUrl = null;
        if (avatarUrl is not null)
        {
            if (avatarUrl.Length > 500)
                throw new DomainException("Avatar URL must be 500 characters or less.");

            if (!Uri.TryCreate(avatarUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                throw new DomainException("Avatar URL must be a valid http(s) URL.");
            }
        }

        var avatarColor = command.AvatarColor?.Trim();
        if (avatarColor == string.Empty) avatarColor = null;
        if (avatarColor is not null && !HexColorRegex.IsMatch(avatarColor))
            throw new DomainException("Avatar color must be a valid hex color like #22c55e.");

        user.DisplayName = displayName;
        user.AvatarUrl = avatarUrl;
        user.AvatarColor = avatarColor;

        await _users.SaveChangesAsync();
        return Map(user);
    }

    private static UserProfileDto Map(Domain.Entities.User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            AvatarColor = user.AvatarColor,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt
        };
    }
}


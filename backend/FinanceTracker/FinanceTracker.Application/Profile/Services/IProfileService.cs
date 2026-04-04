using FinanceTracker.Application.Profile.Commands;
using FinanceTracker.Application.Profile.DTOs;

namespace FinanceTracker.Application.Profile.Services;

public interface IProfileService
{
    Task<UserProfileDto> GetAsync(Guid userId);
    Task<UserProfileDto> UpdateAsync(Guid userId, UpdateProfileCommand command);
}


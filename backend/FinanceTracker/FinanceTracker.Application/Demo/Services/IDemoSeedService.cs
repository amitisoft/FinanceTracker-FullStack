using FinanceTracker.Application.Demo.DTOs;

namespace FinanceTracker.Application.Demo.Services;

public interface IDemoSeedService
{
    Task<DemoSeedResultDto> SeedAsync(Guid userId, DateTime utcNow);

    Task<DemoClearResultDto> ClearAsync(Guid userId);
}

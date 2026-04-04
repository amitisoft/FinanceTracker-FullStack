using FinanceTracker.Application.Recurring.Services;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceTracker.Infrastructure.Background;

public class RecurringProcessingHostedService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RecurringProcessingHostedService> _logger;
    private readonly TimeSpan _interval;

    public RecurringProcessingHostedService(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<RecurringProcessingHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        var minutes = configuration.GetValue<int?>("Recurring:ProcessIntervalMinutes") ?? 15;
        _interval = TimeSpan.FromMinutes(Math.Clamp(minutes, 1, 1440));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Run once on startup, then on a fixed interval.
        await ProcessDueAsync(stoppingToken);

        using var timer = new PeriodicTimer(_interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await ProcessDueAsync(stoppingToken);
        }
    }

    private async Task ProcessDueAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FinanceTrackerDbContext>();
            var recurringService = scope.ServiceProvider.GetRequiredService<IRecurringTransactionService>();

            var now = DateTime.UtcNow;
            var userIds = await db.RecurringTransactions
                .AsNoTracking()
                .Where(r => !r.IsPaused && r.AutoCreateTransaction && r.NextRunDate.Date <= now.Date)
                .Select(r => r.UserId)
                .Distinct()
                .ToListAsync(stoppingToken);

            foreach (var userId in userIds)
            {
                await recurringService.ProcessDueAsync(userId, now);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process due recurring transactions.");
        }
    }
}

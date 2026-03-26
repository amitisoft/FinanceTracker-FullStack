using FinanceTracker.Application.Dashboard.DTOs;
using FinanceTracker.Application.Dashboard.Queries;

namespace FinanceTracker.Application.Dashboard.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, GetDashboardSummaryQuery query);
}
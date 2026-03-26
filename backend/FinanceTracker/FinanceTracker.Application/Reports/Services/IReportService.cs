using FinanceTracker.Application.Reports.DTOs;
using FinanceTracker.Application.Reports.Queries;

namespace FinanceTracker.Application.Reports.Services;

public interface IReportService
{
    Task<IReadOnlyList<CategorySpendReportItemDto>> GetCategorySpendAsync(Guid userId, GetCategorySpendReportQuery query);

    Task<IReadOnlyList<IncomeVsExpenseReportItemDto>> GetIncomeVsExpenseAsync(Guid userId, GetIncomeVsExpenseReportQuery query);

    Task<IReadOnlyList<AccountBalanceTrendItemDto>> GetAccountBalanceTrendAsync(Guid userId, GetAccountBalanceTrendQuery query);

    Task<TrendsReportDto> GetTrendsAsync(Guid userId, GetTrendsReportQuery query);

    Task<IReadOnlyList<NetWorthPointDto>> GetNetWorthAsync(Guid userId, GetNetWorthReportQuery query);
}

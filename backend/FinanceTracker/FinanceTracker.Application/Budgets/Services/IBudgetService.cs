using FinanceTracker.Application.Budgets.Commands;
using FinanceTracker.Application.Budgets.DTOs;
using FinanceTracker.Application.Budgets.Queries;

namespace FinanceTracker.Application.Budgets.Services;

public interface IBudgetService
{
    Task<BudgetDto> CreateAsync(Guid userId, CreateBudgetCommand command);

    Task<IReadOnlyList<BudgetDto>> GetByMonthYearAsync(Guid userId, GetBudgetsQuery query);

    Task<BudgetDto?> UpdateAsync(Guid userId, Guid id, UpdateBudgetCommand command);

    Task<bool> DeleteAsync(Guid userId, Guid id);
}
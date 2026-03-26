using FinanceTracker.Application.Goals.Commands;
using FinanceTracker.Application.Goals.DTOs;

namespace FinanceTracker.Application.Goals.Services;

public interface IGoalService
{
    Task<IReadOnlyList<GoalDto>> GetAllAsync(Guid userId);

    Task<GoalDto> CreateAsync(Guid userId, CreateGoalCommand command);

    Task<GoalDto?> UpdateAsync(Guid userId, Guid id, UpdateGoalCommand command);

    Task<GoalDto?> ContributeAsync(Guid userId, Guid id, GoalContributionCommand command);

    Task<GoalDto?> WithdrawAsync(Guid userId, Guid id, GoalWithdrawCommand command);
}
using FinanceTracker.Application.Goals.Commands;
using FinanceTracker.Application.Goals.DTOs;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Goals.Services;

public class GoalService : IGoalService
{
    private readonly IGoalRepository _goalRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly IAccountActivityRepository _activityRepository;

    public GoalService(
        IGoalRepository goalRepository,
        IAccountRepository accountRepository,
        IAccountActivityRepository activityRepository)
    {
        _goalRepository = goalRepository;
        _accountRepository = accountRepository;
        _activityRepository = activityRepository;
    }

    public async Task<IReadOnlyList<GoalDto>> GetAllAsync(Guid userId)
    {
        var goals = await _goalRepository.GetAllByUserIdAsync(userId);
        return goals.Select(Map).ToList();
    }

    public async Task<GoalDto> CreateAsync(Guid userId, CreateGoalCommand command)
    {
        ValidateName(command.Name);
        ValidateAmount(command.TargetAmount, "Target amount");
        if (command.CurrentAmount < 0)
            throw new DomainException("Current amount cannot be negative.");

        if (decimal.Round(command.CurrentAmount, 2) != command.CurrentAmount)
            throw new DomainException("Current amount can have at most 2 decimal places.");

        if (command.LinkedAccountId.HasValue)
        {
            var linkedAccount = await _accountRepository.GetByIdAsync(command.LinkedAccountId.Value, userId);
            if (linkedAccount is null)
                throw new DomainException("Linked account not found.");
        }

        var goal = new Goal
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = command.Name.Trim(),
            TargetAmount = command.TargetAmount,
            CurrentAmount = command.CurrentAmount,
            TargetDate = command.TargetDate,
            LinkedAccountId = command.LinkedAccountId,
            Icon = string.IsNullOrWhiteSpace(command.Icon) ? null : command.Icon.Trim(),
            Color = string.IsNullOrWhiteSpace(command.Color) ? null : command.Color.Trim(),
            Status = command.CurrentAmount >= command.TargetAmount ? "completed" : "active"
        };

        await _goalRepository.AddAsync(goal);
        await _goalRepository.SaveChangesAsync();

        return Map(goal);
    }

    public async Task<GoalDto?> UpdateAsync(Guid userId, Guid id, UpdateGoalCommand command)
    {
        var goal = await _goalRepository.GetByIdAsync(id, userId);
        if (goal is null)
            return null;

        ValidateName(command.Name);
        ValidateAmount(command.TargetAmount, "Target amount");

        if (command.LinkedAccountId.HasValue)
        {
            var linkedAccount = await _accountRepository.GetByIdAsync(command.LinkedAccountId.Value, userId);
            if (linkedAccount is null)
                throw new DomainException("Linked account not found.");
        }

        goal.Name = command.Name.Trim();
        goal.TargetAmount = command.TargetAmount;
        goal.TargetDate = command.TargetDate;
        goal.LinkedAccountId = command.LinkedAccountId;
        goal.Icon = string.IsNullOrWhiteSpace(command.Icon) ? null : command.Icon.Trim();
        goal.Color = string.IsNullOrWhiteSpace(command.Color) ? null : command.Color.Trim();
        goal.Status = string.IsNullOrWhiteSpace(command.Status) ? goal.Status : command.Status.Trim().ToLowerInvariant();

        if (goal.CurrentAmount >= goal.TargetAmount)
            goal.Status = "completed";

        await _goalRepository.SaveChangesAsync();
        return Map(goal);
    }

    public async Task<GoalDto?> ContributeAsync(Guid userId, Guid id, GoalContributionCommand command)
    {
        var goal = await _goalRepository.GetByIdAsync(id, userId);
        if (goal is null)
            return null;

        ValidateAmount(command.Amount, "Contribution amount");

        if (command.SourceAccountId.HasValue)
        {
            var account = await _accountRepository.GetByIdAsync(command.SourceAccountId.Value, userId);
            if (account is null)
                throw new DomainException("Source account not found.");

            if (!account.CanDebit(command.Amount))
                throw new DomainException("Insufficient balance in the source account.");

            account.CurrentBalance -= command.Amount;
            account.LastUpdatedAt = DateTime.UtcNow;

            await _activityRepository.AddAsync(new AccountActivity
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                UserId = userId,
                Action = "goal_contribution",
                EntityType = "goal",
                EntityId = goal.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        goal.CurrentAmount += command.Amount;

        if (goal.CurrentAmount >= goal.TargetAmount)
            goal.Status = "completed";

        await _goalRepository.SaveChangesAsync();
        return Map(goal);
    }

    public async Task<GoalDto?> WithdrawAsync(Guid userId, Guid id, GoalWithdrawCommand command)
    {
        var goal = await _goalRepository.GetByIdAsync(id, userId);
        if (goal is null)
            return null;

        ValidateAmount(command.Amount, "Withdraw amount");

        if (goal.CurrentAmount < command.Amount)
            throw new DomainException("Withdraw amount cannot exceed current goal amount.");

        if (command.DestinationAccountId.HasValue)
        {
            var account = await _accountRepository.GetByIdAsync(command.DestinationAccountId.Value, userId);
            if (account is null)
                throw new DomainException("Destination account not found.");

            account.CurrentBalance += command.Amount;
            account.LastUpdatedAt = DateTime.UtcNow;

            await _activityRepository.AddAsync(new AccountActivity
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                UserId = userId,
                Action = "goal_withdraw",
                EntityType = "goal",
                EntityId = goal.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        goal.CurrentAmount -= command.Amount;

        if (goal.CurrentAmount < goal.TargetAmount && string.Equals(goal.Status, "completed", StringComparison.OrdinalIgnoreCase))
            goal.Status = "active";

        await _goalRepository.SaveChangesAsync();
        return Map(goal);
    }

    private static GoalDto Map(Goal goal)
    {
        var progress = goal.TargetAmount == 0 ? 0 : Math.Round((goal.CurrentAmount / goal.TargetAmount) * 100, 2);

        return new GoalDto
        {
            Id = goal.Id,
            Name = goal.Name,
            TargetAmount = goal.TargetAmount,
            CurrentAmount = goal.CurrentAmount,
            ProgressPercent = progress,
            TargetDate = goal.TargetDate,
            LinkedAccountId = goal.LinkedAccountId,
            Icon = goal.Icon,
            Color = goal.Color,
            Status = goal.Status
        };
    }

    private static void ValidateName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Goal name is required.");

        if (name.Trim().Length > 120)
            throw new DomainException("Goal name cannot exceed 120 characters.");
    }

    private static void ValidateAmount(decimal amount, string fieldName)
    {
        if (amount <= 0)
            throw new DomainException($"{fieldName} must be greater than 0.");

        if (decimal.Round(amount, 2) != amount)
            throw new DomainException($"{fieldName} can have at most 2 decimal places.");
    }
}

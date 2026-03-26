using FinanceTracker.Application.Budgets.Commands;
using FinanceTracker.Application.Budgets.DTOs;
using FinanceTracker.Application.Budgets.Queries;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Budgets.Services;

public class BudgetService : IBudgetService
{
    private static readonly HashSet<int> AllowedThresholds = new() { 80, 100, 120 };

    private readonly IBudgetRepository _budgetRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ITransactionRepository _transactionRepository;

    public BudgetService(
        IBudgetRepository budgetRepository,
        ICategoryRepository categoryRepository,
        ITransactionRepository transactionRepository)
    {
        _budgetRepository = budgetRepository;
        _categoryRepository = categoryRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<BudgetDto> CreateAsync(Guid userId, CreateBudgetCommand command)
    {
        await ValidateBudgetCommand(userId, command.CategoryId, command.Month, command.Year, command.Amount, command.AlertThresholdPercent);

        var existing = await _budgetRepository.GetByCategoryMonthYearAsync(
            userId,
            command.CategoryId,
            command.Month,
            command.Year);

        if (existing is not null)
            throw new DomainException("A budget already exists for this category, month, and year.");

        var budget = new Budget
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CategoryId = command.CategoryId,
            Month = command.Month,
            Year = command.Year,
            Amount = command.Amount,
            AlertThresholdPercent = command.AlertThresholdPercent,
            LastAlertThresholdSent = 0
        };

        await _budgetRepository.AddAsync(budget);
        await _budgetRepository.SaveChangesAsync();

        return await BuildBudgetDto(userId, budget);
    }

    public async Task<IReadOnlyList<BudgetDto>> GetByMonthYearAsync(Guid userId, GetBudgetsQuery query)
    {
        if (query.Month < 1 || query.Month > 12)
            throw new DomainException("Month must be between 1 and 12.");

        if (query.Year < 2000 || query.Year > 2100)
            throw new DomainException("Year is invalid.");

        var budgets = await _budgetRepository.GetByMonthYearAsync(userId, query.Month, query.Year);

        var result = new List<BudgetDto>();

        foreach (var budget in budgets)
            result.Add(await BuildBudgetDto(userId, budget));

        return result;
    }

    public async Task<BudgetDto?> UpdateAsync(Guid userId, Guid id, UpdateBudgetCommand command)
    {
        var budget = await _budgetRepository.GetByIdAsync(id, userId);
        if (budget is null)
            return null;

        await ValidateBudgetCommand(userId, command.CategoryId, command.Month, command.Year, command.Amount, command.AlertThresholdPercent);

        var duplicate = await _budgetRepository.GetByCategoryMonthYearAsync(
            userId,
            command.CategoryId,
            command.Month,
            command.Year,
            id);

        if (duplicate is not null)
            throw new DomainException("A budget already exists for this category, month, and year.");

        budget.CategoryId = command.CategoryId;
        budget.Month = command.Month;
        budget.Year = command.Year;
        budget.Amount = command.Amount;
        budget.AlertThresholdPercent = command.AlertThresholdPercent;

        await _budgetRepository.SaveChangesAsync();

        return await BuildBudgetDto(userId, budget);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id)
    {
        var budget = await _budgetRepository.GetByIdAsync(id, userId);
        if (budget is null)
            return false;

        _budgetRepository.Remove(budget);
        await _budgetRepository.SaveChangesAsync();

        return true;
    }

    private async Task ValidateBudgetCommand(Guid userId, Guid categoryId, int month, int year, decimal amount, int alertThresholdPercent)
    {
        if (month < 1 || month > 12)
            throw new DomainException("Month must be between 1 and 12.");

        if (year < 2000 || year > 2100)
            throw new DomainException("Year is invalid.");

        if (amount <= 0)
            throw new DomainException("Budget amount must be greater than 0.");

        if (decimal.Round(amount, 2) != amount)
            throw new DomainException("Budget amount can have at most 2 decimal places.");

        if (!AllowedThresholds.Contains(alertThresholdPercent))
            throw new DomainException("Alert threshold percent must be 80, 100, or 120.");

        var category = await _categoryRepository.GetByIdAsync(categoryId, userId);
        if (category is null)
            throw new DomainException("Category not found.");

        if (!string.Equals(category.Type, "expense", StringComparison.OrdinalIgnoreCase))
            throw new DomainException("Budgets can only be created for expense categories.");

        if (category.IsArchived)
            throw new DomainException("Archived categories cannot be used.");
    }

    private async Task<BudgetDto> BuildBudgetDto(Guid userId, Budget budget)
    {
        var category = await _categoryRepository.GetByIdAsync(budget.CategoryId, userId)
            ?? throw new DomainException("Category not found.");

        var allTransactions = await _transactionRepository.GetAllByUserIdAsync(userId);

        var spent = allTransactions
            .Where(t =>
                t.CategoryId == budget.CategoryId &&
                string.Equals(t.Type, "expense", StringComparison.OrdinalIgnoreCase) &&
                t.TransactionDate.Month == budget.Month &&
                t.TransactionDate.Year == budget.Year)
            .Sum(t => t.Amount);

        var remaining = budget.Amount - spent;
        var progress = budget.Amount == 0 ? 0 : Math.Round((spent / budget.Amount) * 100, 2);

        int? triggeredThreshold = null;

        if (progress >= 120 && budget.LastAlertThresholdSent < 120)
        {
            budget.LastAlertThresholdSent = 120;
            triggeredThreshold = 120;
        }
        else if (progress >= 100 && budget.LastAlertThresholdSent < 100)
        {
            budget.LastAlertThresholdSent = 100;
            triggeredThreshold = 100;
        }
        else if (progress >= 80 && budget.LastAlertThresholdSent < 80)
        {
            budget.LastAlertThresholdSent = 80;
            triggeredThreshold = 80;
        }

        if (triggeredThreshold.HasValue)
            await _budgetRepository.SaveChangesAsync();

        return new BudgetDto
        {
            Id = budget.Id,
            CategoryId = budget.CategoryId,
            CategoryName = category.Name,
            Month = budget.Month,
            Year = budget.Year,
            Amount = budget.Amount,
            AlertThresholdPercent = budget.AlertThresholdPercent,
            Spent = spent,
            Remaining = remaining,
            ProgressPercent = progress,
            TriggeredThreshold = triggeredThreshold
        };
    }
}
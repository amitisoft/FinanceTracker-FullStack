using FinanceTracker.Application.Recurring.Commands;
using FinanceTracker.Application.Recurring.DTOs;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Recurring.Services;

public class RecurringTransactionService(
    IRecurringTransactionRepository recurringRepository,
    IAccountRepository accountRepository,
    ICategoryRepository categoryRepository,
    ITransactionRepository transactionRepository) : IRecurringTransactionService
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "income",
        "expense"
    };

    private static readonly HashSet<string> AllowedFrequencies = new(StringComparer.OrdinalIgnoreCase)
    {
        "daily",
        "weekly",
        "monthly",
        "yearly"
    };

    private readonly IRecurringTransactionRepository _recurringRepository = recurringRepository;
    private readonly IAccountRepository _accountRepository = accountRepository;
    private readonly ICategoryRepository _categoryRepository = categoryRepository;
    private readonly ITransactionRepository _transactionRepository = transactionRepository;

    public async Task<IReadOnlyList<RecurringTransactionDto>> GetAllAsync(Guid userId)
    {
        var items = await _recurringRepository.GetAllByUserIdAsync(userId);
        return items.Select(Map).ToList();
    }

    public async Task<RecurringTransactionDto> CreateAsync(Guid userId, CreateRecurringTransactionCommand command)
    {
        await ValidateCommand(userId, command.Type, command.Amount, command.CategoryId, command.AccountId, command.Frequency);

        if (string.IsNullOrWhiteSpace(command.Title))
            throw new DomainException("Title is required.");

        var startDate = NormalizeToUtc(command.StartDate);
        var endDate = command.EndDate.HasValue
            ? NormalizeToUtc(command.EndDate.Value)
            : (DateTime?)null;

        if (startDate == default)
            throw new DomainException("Start date is required.");

        if (endDate.HasValue && endDate.Value.Date < startDate.Date)
            throw new DomainException("End date cannot be before start date.");

        var recurring = new RecurringTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = command.Title.Trim(),
            Type = command.Type.Trim().ToLowerInvariant(),
            Amount = command.Amount,
            CategoryId = command.CategoryId,
            AccountId = command.AccountId,
            Frequency = command.Frequency.Trim().ToLowerInvariant(),
            StartDate = startDate,
            EndDate = endDate,
            NextRunDate = startDate,
            AutoCreateTransaction = command.AutoCreateTransaction,
            IsPaused = false
        };

        await _recurringRepository.AddAsync(recurring);
        await _recurringRepository.SaveChangesAsync();

        return Map(recurring);
    }

    public async Task<RecurringTransactionDto?> UpdateAsync(Guid userId, Guid id, UpdateRecurringTransactionCommand command)
    {
        var recurring = await _recurringRepository.GetByIdAsync(id, userId);
        if (recurring is null)
            return null;

        await ValidateCommand(userId, command.Type, command.Amount, command.CategoryId, command.AccountId, command.Frequency);

        if (string.IsNullOrWhiteSpace(command.Title))
            throw new DomainException("Title is required.");

        var startDate = NormalizeToUtc(command.StartDate);
        var endDate = command.EndDate.HasValue
            ? NormalizeToUtc(command.EndDate.Value)
            : (DateTime?)null;
        var nextRunDate = NormalizeToUtc(command.NextRunDate);

        if (startDate == default)
            throw new DomainException("Start date is required.");

        if (nextRunDate == default)
            throw new DomainException("Next run date is required.");

        if (endDate.HasValue && endDate.Value.Date < startDate.Date)
            throw new DomainException("End date cannot be before start date.");

        recurring.Title = command.Title.Trim();
        recurring.Type = command.Type.Trim().ToLowerInvariant();
        recurring.Amount = command.Amount;
        recurring.CategoryId = command.CategoryId;
        recurring.AccountId = command.AccountId;
        recurring.Frequency = command.Frequency.Trim().ToLowerInvariant();
        recurring.StartDate = startDate;
        recurring.EndDate = endDate;
        recurring.NextRunDate = nextRunDate;
        recurring.AutoCreateTransaction = command.AutoCreateTransaction;
        recurring.IsPaused = command.IsPaused;

        await _recurringRepository.SaveChangesAsync();
        return Map(recurring);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id)
    {
        var recurring = await _recurringRepository.GetByIdAsync(id, userId);
        if (recurring is null)
            return false;

        _recurringRepository.Remove(recurring);
        await _recurringRepository.SaveChangesAsync();
        return true;
    }

    public async Task<RecurringProcessResultDto> ProcessDueAsync(Guid userId, DateTime asOfDate)
    {
        var normalizedAsOfDate = NormalizeToUtc(asOfDate).Date;
        var dueItems = await _recurringRepository.GetDueAsync(userId, normalizedAsOfDate);
        var result = new RecurringProcessResultDto();

        foreach (var item in dueItems)
        {
            if (item.IsPaused || !item.AutoCreateTransaction)
                continue;

            if (!item.AccountId.HasValue || !item.CategoryId.HasValue)
                continue;

            var account = await _accountRepository.GetByIdAsync(item.AccountId.Value, userId);
            var category = await _categoryRepository.GetByIdAsync(item.CategoryId.Value, userId);

            if (account is null || category is null || category.IsArchived)
                continue;

            var now = DateTime.UtcNow;
            var txDate = NormalizeToUtc(item.NextRunDate);

            var tx = new Transaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountId = item.AccountId.Value,
                CategoryId = item.CategoryId.Value,
                Type = item.Type,
                Amount = item.Amount,
                TransactionDate = txDate,
                Merchant = item.Title,
                Note = "Auto-created from recurring transaction",
                CreatedAt = now,
                UpdatedAt = now
            };

            if (string.Equals(item.Type, "income", StringComparison.OrdinalIgnoreCase))
            {
                account.CurrentBalance += item.Amount;
            }
            else
            {
                if (!account.CanDebit(item.Amount))
                    continue;
                account.CurrentBalance -= item.Amount;
            }

            account.LastUpdatedAt = now;

            await _transactionRepository.AddAsync(tx);
            result.CreatedTransactionIds.Add(tx.Id);
            result.ProcessedCount++;

            item.NextRunDate = NormalizeToUtc(GetNextRunDate(item.NextRunDate, item.Frequency));

            if (item.EndDate.HasValue && item.NextRunDate.Date > item.EndDate.Value.Date)
                item.IsPaused = true;
        }

        if (result.ProcessedCount > 0)
            await _transactionRepository.SaveChangesAsync();

        await _recurringRepository.SaveChangesAsync();

        return result;
    }

    private async Task ValidateCommand(Guid userId, string? type, decimal amount, Guid? categoryId, Guid? accountId, string? frequency)
    {
        if (string.IsNullOrWhiteSpace(type) || !AllowedTypes.Contains(type.Trim()))
            throw new DomainException("Recurring transaction type must be income or expense.");

        if (amount <= 0)
            throw new DomainException("Amount must be greater than 0.");

        if (decimal.Round(amount, 2) != amount)
            throw new DomainException("Amount can have at most 2 decimal places.");

        if (string.IsNullOrWhiteSpace(frequency) || !AllowedFrequencies.Contains(frequency.Trim()))
            throw new DomainException("Frequency must be daily, weekly, monthly, or yearly.");

        if (!accountId.HasValue)
            throw new DomainException("Account is required.");

        if (!categoryId.HasValue)
            throw new DomainException("Category is required.");

        var account = await _accountRepository.GetByIdAsync(accountId.Value, userId);
        if (account is null)
            throw new DomainException("Account not found.");

        var category = await _categoryRepository.GetByIdAsync(categoryId.Value, userId);
        if (category is null)
            throw new DomainException("Category not found.");

        if (!string.Equals(category.Type, type.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new DomainException("Category type must match recurring transaction type.");
    }

    private static DateTime GetNextRunDate(DateTime current, string frequency)
    {
        return frequency.ToLowerInvariant() switch
        {
            "daily" => current.AddDays(1),
            "weekly" => current.AddDays(7),
            "monthly" => current.AddMonths(1),
            "yearly" => current.AddYears(1),
            _ => current
        };
    }

    private static RecurringTransactionDto Map(RecurringTransaction item)
    {
        return new RecurringTransactionDto
        {
            Id = item.Id,
            Title = item.Title,
            Type = item.Type,
            Amount = item.Amount,
            CategoryId = item.CategoryId,
            AccountId = item.AccountId,
            Frequency = item.Frequency,
            StartDate = item.StartDate,
            EndDate = item.EndDate,
            NextRunDate = item.NextRunDate,
            AutoCreateTransaction = item.AutoCreateTransaction,
            IsPaused = item.IsPaused
        };
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
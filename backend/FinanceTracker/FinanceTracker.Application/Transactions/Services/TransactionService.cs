using FinanceTracker.Application.Transactions.Commands;
using FinanceTracker.Application.Transactions.DTOs;
using FinanceTracker.Application.Transactions.Queries;
using FinanceTracker.Application.Rules.Services;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Transactions.Services;

public class TransactionService : ITransactionService
{
    private static readonly HashSet<string> AllowedPaymentMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "cash",
        "card",
        "upi",
        "bank_transfer",
        "wallet",
        "cheque"
    };

    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "income",
        "expense"
    };

    private readonly ITransactionRepository _transactionRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IRuleService _ruleService;
    private readonly IAccountMemberRepository _memberRepository;
    private readonly IAccountActivityRepository _activityRepository;

    public TransactionService(
        ITransactionRepository transactionRepository,
        IAccountRepository accountRepository,
        ICategoryRepository categoryRepository,
        IRuleService ruleService,
        IAccountMemberRepository memberRepository,
        IAccountActivityRepository activityRepository)
    {
        _transactionRepository = transactionRepository;
        _accountRepository = accountRepository;
        _categoryRepository = categoryRepository;
        _ruleService = ruleService;
        _memberRepository = memberRepository;
        _activityRepository = activityRepository;
    }

    public async Task<TransactionDto> CreateAsync(Guid userId, CreateTransactionCommand command)
    {
        var context = await BuildAndValidateTransactionContext(
            userId,
            command.Type,
            command.Amount,
            command.Date,
            command.AccountId,
            command.CategoryId,
            command.Merchant,
            command.Note,
            command.PaymentMethod);

        var resolvedCategoryId = command.CategoryId;
        if (resolvedCategoryId is null)
        {
            var rule = await _ruleService.GetMatchingRuleAsync(
                userId,
                command.Merchant ?? string.Empty,
                command.Note ?? string.Empty,
                command.Amount,
                command.Type);
            if (rule?.CategoryId is not null)
                resolvedCategoryId = rule.CategoryId;
        }

        var finalCategoryId = resolvedCategoryId ??
            throw new DomainException("Category is required (set manually or via a matching rule).");

        if (context.Category is null)
        {
            var ruleCategory = await _categoryRepository.GetByIdAsync(finalCategoryId, userId);
            if (ruleCategory is null)
                throw new DomainException("Category not found.");
            if (ruleCategory.IsArchived)
                throw new DomainException("Archived categories cannot be used.");
            if (!string.Equals(ruleCategory.Type, command.Type, StringComparison.OrdinalIgnoreCase))
                throw new DomainException("Category type must match transaction type.");
        }

        var type = command.Type.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        if (type == "expense" && !CanDebit(context.Account, command.Amount))
            throw new DomainException("Insufficient balance in the selected account.");

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountId = context.Account.Id,
            CategoryId = finalCategoryId,
            Type = type,
            Amount = command.Amount,
            TransactionDate = command.Date,
            Merchant = context.Merchant,
            Note = context.Note,
            PaymentMethod = context.PaymentMethod,
            CreatedAt = now,
            UpdatedAt = now
        };

        ApplyBalance(context.Account, type, command.Amount);
        context.Account.LastUpdatedAt = now;

        await _transactionRepository.AddAsync(transaction);
        await _activityRepository.AddAsync(new AccountActivity
        {
            Id = Guid.NewGuid(),
            AccountId = transaction.AccountId,
            UserId = userId,
            Action = "created",
            EntityType = "transaction",
            EntityId = transaction.Id,
            CreatedAt = now
        });
        await _transactionRepository.SaveChangesAsync();

        return Map(transaction);
    }

    public async Task<IReadOnlyList<TransactionDto>> GetAllAsync(Guid userId, GetTransactionsQuery query)
    {
        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);
        return transactions.Select(Map).ToList();
    }

    public async Task<TransactionDto?> GetByIdAsync(Guid userId, GetTransactionByIdQuery query)
    {
        var transaction = await _transactionRepository.GetByIdAsync(query.Id, userId);
        return transaction is null ? null : Map(transaction);
    }

    public async Task<TransactionDto?> UpdateAsync(Guid userId, Guid id, UpdateTransactionCommand command)
    {
        var existing = await _transactionRepository.GetByIdAsync(id, userId);
        if (existing is null)
            return null;

        var oldAccount = await _accountRepository.GetByIdAsync(existing.AccountId);
        if (oldAccount is null)
            throw new DomainException("Original account not found.");

        if (oldAccount.UserId != userId)
        {
            var member = await _memberRepository.GetByUserAndAccountAsync(userId, existing.AccountId);
            if (member is null || member.Role == "viewer" || !member.IsActive)
                throw new DomainException("Account access denied.");
        }

        RevertBalance(oldAccount, existing.Type, existing.Amount);
        oldAccount.LastUpdatedAt = DateTime.UtcNow;

        var context = await BuildAndValidateTransactionContext(
            userId,
            command.Type,
            command.Amount,
            command.Date,
            command.AccountId,
            command.CategoryId,
            command.Merchant,
            command.Note,
            command.PaymentMethod);

        var resolvedCategoryId = command.CategoryId;
        if (resolvedCategoryId is null)
        {
            var rule = await _ruleService.GetMatchingRuleAsync(
                userId,
                command.Merchant ?? string.Empty,
                command.Note ?? string.Empty,
                command.Amount,
                command.Type);
            if (rule?.CategoryId is not null)
                resolvedCategoryId = rule.CategoryId;
        }

        var finalCategoryId = resolvedCategoryId ??
            throw new DomainException("Category is required (set manually or via a matching rule).");

        if (context.Category is null)
        {
            var ruleCategory = await _categoryRepository.GetByIdAsync(finalCategoryId, userId);
            if (ruleCategory is null)
                throw new DomainException("Category not found.");
            if (ruleCategory.IsArchived)
                throw new DomainException("Archived categories cannot be used.");
            if (!string.Equals(ruleCategory.Type, command.Type, StringComparison.OrdinalIgnoreCase))
                throw new DomainException("Category type must match transaction type.");
        }

        var newType = command.Type.Trim().ToLowerInvariant();

        if (newType == "expense" && !CanDebit(context.Account, command.Amount))
            throw new DomainException("Insufficient balance in the selected account.");

        existing.AccountId = context.Account.Id;
        existing.CategoryId = finalCategoryId;
        existing.Type = newType;
        existing.Amount = command.Amount;
        existing.TransactionDate = command.Date;
        existing.Merchant = context.Merchant;
        existing.Note = context.Note;
        existing.PaymentMethod = context.PaymentMethod;
        existing.UpdatedAt = DateTime.UtcNow;

        ApplyBalance(context.Account, newType, command.Amount);
        context.Account.LastUpdatedAt = DateTime.UtcNow;

        await _activityRepository.AddAsync(new AccountActivity
        {
            Id = Guid.NewGuid(),
            AccountId = existing.AccountId,
            UserId = userId,
            Action = "updated",
            EntityType = "transaction",
            EntityId = existing.Id,
            CreatedAt = DateTime.UtcNow
        });
        await _transactionRepository.SaveChangesAsync();

        return Map(existing);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id)
    {
        var existing = await _transactionRepository.GetByIdAsync(id, userId);
        if (existing is null)
            return false;

        var account = await _accountRepository.GetByIdAsync(existing.AccountId);
        if (account is null)
            throw new DomainException("Account not found.");

        if (account.UserId != userId)
        {
            var member = await _memberRepository.GetByUserAndAccountAsync(userId, existing.AccountId);
            if (member is null || member.Role == "viewer" || !member.IsActive)
                throw new DomainException("Account access denied.");
        }

        RevertBalance(account, existing.Type, existing.Amount);
        account.LastUpdatedAt = DateTime.UtcNow;

        _transactionRepository.Remove(existing);
        await _activityRepository.AddAsync(new AccountActivity
        {
            Id = Guid.NewGuid(),
            AccountId = existing.AccountId,
            UserId = userId,
            Action = "deleted",
            EntityType = "transaction",
            EntityId = existing.Id,
            CreatedAt = DateTime.UtcNow
        });
        await _transactionRepository.SaveChangesAsync();

        return true;
    }

    private async Task<(Account Account, Category? Category, string? Merchant, string? Note, string? PaymentMethod)>
        BuildAndValidateTransactionContext(
            Guid userId,
            string? typeInput,
            decimal amount,
            DateTime date,
            Guid accountId,
            Guid? categoryId,
            string? merchantInput,
            string? noteInput,
            string? paymentMethodInput)
    {
        var type = typeInput?.Trim().ToLowerInvariant() ?? string.Empty;
        var merchant = string.IsNullOrWhiteSpace(merchantInput) ? null : merchantInput.Trim();
        var note = string.IsNullOrWhiteSpace(noteInput) ? null : noteInput.Trim();
        var paymentMethod = string.IsNullOrWhiteSpace(paymentMethodInput) ? null : paymentMethodInput.Trim();

        if (paymentMethod is not null && !AllowedPaymentMethods.Contains(paymentMethod))
            throw new DomainException("Payment method must be one of: cash, card, upi, bank_transfer, wallet, cheque.");

        if (!AllowedTypes.Contains(type))
            throw new DomainException("Transaction type must be income or expense.");

        if (amount <= 0)
            throw new DomainException("Amount must be greater than 0.");

        if (decimal.Round(amount, 2) != amount)
            throw new DomainException("Amount can have at most 2 decimal places.");

        if (date == default)
            throw new DomainException("Transaction date is required.");

        var account = await _accountRepository.GetByIdAsync(accountId);
        if (account is null)
            throw new DomainException("Account not found.");

        if (account.UserId != userId)
        {
            var member = await _memberRepository.GetByUserAndAccountAsync(userId, accountId);
            if (member is null || member.Role == "viewer" || !member.IsActive)
                throw new DomainException("Account access denied.");
        }

        Category? category = null;
        if (categoryId is not null)
        {
            category = await _categoryRepository.GetByIdAsync(categoryId.Value, userId);
            if (category is null)
                throw new DomainException("Category not found.");

            if (category.IsArchived)
                throw new DomainException("Archived categories cannot be used.");

            if (!string.Equals(category.Type, type, StringComparison.OrdinalIgnoreCase))
                throw new DomainException("Category type must match transaction type.");
        }

        if (merchant is not null && merchant.Length > 200)
            throw new DomainException("Merchant cannot exceed 200 characters.");

        if (paymentMethod is not null && paymentMethod.Length > 50)
            throw new DomainException("Payment method cannot exceed 50 characters.");

        return (account, category, merchant, note, paymentMethod);
    }

    private static void ApplyBalance(Account account, string type, decimal amount)
    {
        if (type == "income")
            account.CurrentBalance += amount;
        else
            account.CurrentBalance -= amount;
    }

    private static void RevertBalance(Account account, string type, decimal amount)
    {
        if (type == "income")
            account.CurrentBalance -= amount;
        else
            account.CurrentBalance += amount;
    }

    private static bool CanDebit(Account account, decimal amount)
    {
        return account.CurrentBalance - amount >= 0;
    }

    private static TransactionDto Map(Transaction transaction)
    {
        return new TransactionDto
        {
            Id = transaction.Id,
            AccountId = transaction.AccountId,
            CategoryId = transaction.CategoryId,
            Type = transaction.Type,
            Amount = transaction.Amount,
            Date = transaction.TransactionDate,
            Merchant = transaction.Merchant,
            Note = transaction.Note,
            PaymentMethod = transaction.PaymentMethod,
            CreatedAt = transaction.CreatedAt,
            UpdatedAt = transaction.UpdatedAt
        };
    }
}

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
        "expense",
        "transfer"
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
            command.DestinationAccountId,
            command.CategoryId,
            command.Merchant,
            command.Note,
            command.PaymentMethod,
            command.Tags,
            null);

        var type = command.Type.Trim().ToLowerInvariant();

        if (type == "transfer" && command.CategoryId is not null)
            throw new DomainException("Category must be empty for transfer transactions.");

        Guid? finalCategoryId = null;
        if (type != "transfer")
        {
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

            finalCategoryId = resolvedCategoryId ??
                throw new DomainException("Category is required (set manually or via a matching rule).");
        }

        if (type != "transfer" && context.Category is null)
        {
            var ruleCategory = await _categoryRepository.GetByIdAsync(finalCategoryId!.Value, userId);
            if (ruleCategory is null)
                throw new DomainException("Category not found.");
            if (ruleCategory.IsArchived)
                throw new DomainException("Archived categories cannot be used.");
            if (!string.Equals(ruleCategory.Type, command.Type, StringComparison.OrdinalIgnoreCase))
                throw new DomainException("Category type must match transaction type.");
        }

        var now = DateTime.UtcNow;

        if (type == "expense" && !CanDebit(context.Account, command.Amount))
            throw new DomainException("Insufficient balance in the selected account.");

        if (type == "transfer")
        {
            if (context.DestinationAccount is null)
                throw new DomainException("Destination account is required for transfers.");
            if (context.DestinationAccount.Id == context.Account.Id)
                throw new DomainException("Source and destination accounts must be different.");
            if (!CanDebit(context.Account, command.Amount))
                throw new DomainException("Insufficient balance in the selected account.");
        }

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountId = context.Account.Id,
            DestinationAccountId = context.DestinationAccount?.Id,
            CategoryId = finalCategoryId,
            Type = type,
            Amount = command.Amount,
            TransactionDate = command.Date,
            Merchant = context.Merchant,
            Note = context.Note,
            PaymentMethod = context.PaymentMethod,
            Tags = context.Tags,
            CreatedAt = now,
            UpdatedAt = now
        };

        if (type == "transfer")
        {
            context.Account.CurrentBalance -= command.Amount;
            context.DestinationAccount!.CurrentBalance += command.Amount;
            context.DestinationAccount.LastUpdatedAt = now;
        }
        else
        {
            ApplyBalance(context.Account, type, command.Amount);
        }

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

        if (type == "transfer")
        {
            await _activityRepository.AddAsync(new AccountActivity
            {
                Id = Guid.NewGuid(),
                AccountId = context.DestinationAccount!.Id,
                UserId = userId,
                Action = "created",
                EntityType = "transaction",
                EntityId = transaction.Id,
                CreatedAt = now
            });
        }

        await _transactionRepository.SaveChangesAsync();

        return Map(transaction);
    }

    public async Task<IReadOnlyList<TransactionDto>> GetAllAsync(Guid userId, GetTransactionsQuery query)
    {
        var transactions = await _transactionRepository.GetAllByUserIdAsync(userId);
        var filtered = transactions.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(query.Type))
        {
            var type = query.Type.Trim().ToLowerInvariant();
            filtered = filtered.Where(t => t.Type.Equals(type, StringComparison.OrdinalIgnoreCase));
        }

        if (query.AccountId.HasValue)
            filtered = filtered.Where(t => t.AccountId == query.AccountId.Value || t.DestinationAccountId == query.AccountId.Value);

        if (query.CategoryId.HasValue)
            filtered = filtered.Where(t => t.CategoryId == query.CategoryId.Value);

        if (query.DateFrom.HasValue)
            filtered = filtered.Where(t => t.TransactionDate.Date >= query.DateFrom.Value.Date);

        if (query.DateTo.HasValue)
            filtered = filtered.Where(t => t.TransactionDate.Date <= query.DateTo.Value.Date);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            filtered = filtered.Where(t =>
                (!string.IsNullOrWhiteSpace(t.Merchant) && t.Merchant.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(t.Note) && t.Note.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        var sortBy = query.SortBy?.Trim().ToLowerInvariant() ?? "date";
        var sortDir = query.SortDir?.Trim().ToLowerInvariant() ?? "desc";
        var descending = sortDir != "asc";

        filtered = sortBy switch
        {
            "amount" => descending ? filtered.OrderByDescending(t => t.Amount) : filtered.OrderBy(t => t.Amount),
            "created" => descending ? filtered.OrderByDescending(t => t.CreatedAt) : filtered.OrderBy(t => t.CreatedAt),
            _ => descending ? filtered.OrderByDescending(t => t.TransactionDate) : filtered.OrderBy(t => t.TransactionDate)
        };

        var pageSize = query.PageSize <= 0 ? 20 : Math.Clamp(query.PageSize, 5, 100);
        var page = query.Page <= 0 ? 1 : query.Page;
        var skip = (page - 1) * pageSize;

        return filtered
            .Skip(skip)
            .Take(pageSize)
            .Select(Map)
            .ToList();
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

        // If the transaction is visible to the user, allow edits to the existing account(s).

        var oldType = existing.Type?.Trim().ToLowerInvariant() ?? string.Empty;
        var now = DateTime.UtcNow;

        if (oldType == "transfer")
        {
            if (!existing.DestinationAccountId.HasValue)
                throw new DomainException("Original destination account not found.");

            var oldDestination = await _accountRepository.GetByIdAsync(existing.DestinationAccountId.Value);
            if (oldDestination is null)
                throw new DomainException("Original destination account not found.");

            // Account access is validated later when switching accounts.

            oldAccount.CurrentBalance += existing.Amount;
            oldDestination.CurrentBalance -= existing.Amount;

            oldAccount.LastUpdatedAt = now;
            oldDestination.LastUpdatedAt = now;
        }
        else
        {
            var safeType = string.IsNullOrWhiteSpace(existing.Type) ? "expense" : existing.Type;
            RevertBalance(oldAccount, safeType, existing.Amount);
            oldAccount.LastUpdatedAt = now;
        }

        var allowAccounts = new HashSet<Guid> { existing.AccountId };
        if (existing.DestinationAccountId.HasValue)
            allowAccounts.Add(existing.DestinationAccountId.Value);

        var context = await BuildAndValidateTransactionContext(
            userId,
            command.Type,
            command.Amount,
            command.Date,
            command.AccountId,
            command.DestinationAccountId,
            command.CategoryId,
            command.Merchant,
            command.Note,
            command.PaymentMethod,
            command.Tags,
            allowAccounts);

        var newType = command.Type.Trim().ToLowerInvariant();

        if (newType == "transfer" && command.CategoryId is not null)
            throw new DomainException("Category must be empty for transfer transactions.");

        Guid? finalCategoryId = null;
        if (newType != "transfer")
        {
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

            finalCategoryId = resolvedCategoryId ??
                throw new DomainException("Category is required (set manually or via a matching rule).");
        }

        if (newType != "transfer" && context.Category is null)
        {
            var ruleCategory = await _categoryRepository.GetByIdAsync(finalCategoryId!.Value, userId);
            if (ruleCategory is null)
                throw new DomainException("Category not found.");
            if (ruleCategory.IsArchived)
                throw new DomainException("Archived categories cannot be used.");
            if (!string.Equals(ruleCategory.Type, command.Type, StringComparison.OrdinalIgnoreCase))
                throw new DomainException("Category type must match transaction type.");
        }

        if (newType == "expense" && !CanDebit(context.Account, command.Amount))
            throw new DomainException("Insufficient balance in the selected account.");

        if (newType == "transfer")
        {
            if (context.DestinationAccount is null)
                throw new DomainException("Destination account is required for transfers.");
            if (context.DestinationAccount.Id == context.Account.Id)
                throw new DomainException("Source and destination accounts must be different.");
            if (!CanDebit(context.Account, command.Amount))
                throw new DomainException("Insufficient balance in the selected account.");
        }

        existing.AccountId = context.Account.Id;
        existing.DestinationAccountId = context.DestinationAccount?.Id;
        existing.CategoryId = finalCategoryId;
        existing.Type = newType;
        existing.Amount = command.Amount;
        existing.TransactionDate = command.Date;
        existing.Merchant = context.Merchant;
        existing.Note = context.Note;
        existing.PaymentMethod = context.PaymentMethod;
        existing.Tags = context.Tags;
        existing.UpdatedAt = now;

        if (newType == "transfer")
        {
            context.Account.CurrentBalance -= command.Amount;
            context.DestinationAccount!.CurrentBalance += command.Amount;
            context.DestinationAccount.LastUpdatedAt = now;
        }
        else
        {
            ApplyBalance(context.Account, newType, command.Amount);
        }
        context.Account.LastUpdatedAt = now;

        await _activityRepository.AddAsync(new AccountActivity
        {
            Id = Guid.NewGuid(),
            AccountId = existing.AccountId,
            UserId = userId,
            Action = "updated",
            EntityType = "transaction",
            EntityId = existing.Id,
            CreatedAt = now
        });

        if (newType == "transfer")
        {
            await _activityRepository.AddAsync(new AccountActivity
            {
                Id = Guid.NewGuid(),
                AccountId = context.DestinationAccount!.Id,
                UserId = userId,
                Action = "updated",
                EntityType = "transaction",
                EntityId = existing.Id,
                CreatedAt = now
            });
        }
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

        // If the transaction is visible, allow deletion from current account(s).

        var type = existing.Type?.Trim().ToLowerInvariant() ?? string.Empty;
        var now = DateTime.UtcNow;

        if (type == "transfer")
        {
            if (!existing.DestinationAccountId.HasValue)
                throw new DomainException("Destination account not found.");

            var destination = await _accountRepository.GetByIdAsync(existing.DestinationAccountId.Value);
            if (destination is null)
                throw new DomainException("Destination account not found.");

            // Deletion is allowed if the transaction is visible to the user.

            account.CurrentBalance += existing.Amount;
            destination.CurrentBalance -= existing.Amount;
            account.LastUpdatedAt = now;
            destination.LastUpdatedAt = now;
        }
        else
        {
            var safeType = string.IsNullOrWhiteSpace(existing.Type) ? "expense" : existing.Type;
            RevertBalance(account, safeType, existing.Amount);
            account.LastUpdatedAt = now;
        }

        _transactionRepository.Remove(existing);
        await _activityRepository.AddAsync(new AccountActivity
        {
            Id = Guid.NewGuid(),
            AccountId = existing.AccountId,
            UserId = userId,
            Action = "deleted",
            EntityType = "transaction",
            EntityId = existing.Id,
            CreatedAt = now
        });
        if (type == "transfer" && existing.DestinationAccountId.HasValue)
        {
            await _activityRepository.AddAsync(new AccountActivity
            {
                Id = Guid.NewGuid(),
                AccountId = existing.DestinationAccountId.Value,
                UserId = userId,
                Action = "deleted",
                EntityType = "transaction",
                EntityId = existing.Id,
                CreatedAt = now
            });
        }
        await _transactionRepository.SaveChangesAsync();

        return true;
    }

    private async Task<(Account Account, Account? DestinationAccount, Category? Category, string? Merchant, string? Note, string? PaymentMethod, List<string> Tags)>
        BuildAndValidateTransactionContext(
            Guid userId,
            string? typeInput,
            decimal amount,
            DateTime date,
            Guid accountId,
            Guid? destinationAccountId,
            Guid? categoryId,
            string? merchantInput,
            string? noteInput,
            string? paymentMethodInput,
            List<string>? tagsInput,
            ISet<Guid>? allowAccounts)
    {
        var type = typeInput?.Trim().ToLowerInvariant() ?? string.Empty;
        var merchant = string.IsNullOrWhiteSpace(merchantInput) ? null : merchantInput.Trim();
        var note = string.IsNullOrWhiteSpace(noteInput) ? null : noteInput.Trim();
        var paymentMethod = string.IsNullOrWhiteSpace(paymentMethodInput) ? null : paymentMethodInput.Trim();

        if (paymentMethod is not null && !AllowedPaymentMethods.Contains(paymentMethod))
            throw new DomainException("Payment method must be one of: cash, card, upi, bank_transfer, wallet, cheque.");

        if (!AllowedTypes.Contains(type))
            throw new DomainException("Transaction type must be income, expense, or transfer.");

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
            {
                if (allowAccounts is null || !allowAccounts.Contains(accountId))
                    throw new DomainException("Account access denied.");
            }
        }

        Account? destinationAccount = null;
        if (type == "transfer")
        {
            if (!destinationAccountId.HasValue)
                throw new DomainException("Destination account is required for transfers.");

            destinationAccount = await _accountRepository.GetByIdAsync(destinationAccountId.Value);
            if (destinationAccount is null)
                throw new DomainException("Destination account not found.");

            if (destinationAccount.UserId != userId)
            {
                var member = await _memberRepository.GetByUserAndAccountAsync(userId, destinationAccountId.Value);
                if (member is null || member.Role == "viewer" || !member.IsActive)
                {
                    if (allowAccounts is null || !allowAccounts.Contains(destinationAccountId.Value))
                        throw new DomainException("Account access denied.");
                }
            }

            if (destinationAccountId.Value == accountId)
                throw new DomainException("Source and destination accounts must be different.");
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

        var tags = NormalizeAndValidateTags(tagsInput);

        return (account, destinationAccount, category, merchant, note, paymentMethod, tags);
    }

    private static List<string> NormalizeAndValidateTags(List<string>? tagsInput)
    {
        if (tagsInput is null || tagsInput.Count == 0)
            return new List<string>();

        var tags = tagsInput
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Where(t => t.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (tags.Count > 20)
            throw new DomainException("A transaction can have at most 20 tags.");

        foreach (var tag in tags)
        {
            if (tag.Length > 32)
                throw new DomainException("Each tag cannot exceed 32 characters.");
        }

        return tags;
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
            DestinationAccountId = transaction.DestinationAccountId,
            CategoryId = transaction.CategoryId,
            Type = transaction.Type,
            Amount = transaction.Amount,
            Date = transaction.TransactionDate,
            Merchant = transaction.Merchant,
            Note = transaction.Note,
            PaymentMethod = transaction.PaymentMethod,
            Tags = transaction.Tags ?? new List<string>(),
            CreatedAt = transaction.CreatedAt,
            UpdatedAt = transaction.UpdatedAt
        };
    }
}

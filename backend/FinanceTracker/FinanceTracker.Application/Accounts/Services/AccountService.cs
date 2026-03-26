using FinanceTracker.Application.Accounts.Commands;
using FinanceTracker.Application.Accounts.DTOs;
using FinanceTracker.Application.Accounts.Queries;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Accounts.Services;

public class AccountService : IAccountService
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "bank",
        "credit_card",
        "cash",
        "savings"
    };

    private readonly IAccountRepository _accountRepository;
    private readonly IAccountMemberRepository _memberRepository;

    public AccountService(IAccountRepository accountRepository, IAccountMemberRepository memberRepository)
    {
        _accountRepository = accountRepository;
        _memberRepository = memberRepository;
    }

    public async Task<AccountDto> CreateAsync(Guid userId, CreateAccountCommand command)
    {
        var name = command.Name?.Trim() ?? string.Empty;
        var type = command.Type?.Trim().ToLowerInvariant() ?? string.Empty;
        var institutionName = string.IsNullOrWhiteSpace(command.InstitutionName)
            ? null
            : command.InstitutionName.Trim();

        if (command.OpeningBalance < 0)
            throw new DomainException("Opening Balance Should not be in Negative Number.");

        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Account name is required.");

        if (name.Length > 100)
            throw new DomainException("Account name cannot exceed 100 characters.");

        if (!AllowedTypes.Contains(type))
            throw new DomainException("Account type must be one of: bank, credit_card, cash, savings.");

        if (institutionName is not null && institutionName.Length > 120)
            throw new DomainException("Institution name cannot exceed 120 characters.");

        if (decimal.Round(command.OpeningBalance, 2) != command.OpeningBalance)
            throw new DomainException("Opening balance can have at most 2 decimal places.");

        var now = DateTime.UtcNow;

        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Type = type,
            OpeningBalance = command.OpeningBalance,
            CurrentBalance = command.OpeningBalance,
            InstitutionName = institutionName,
            CreatedAt = now,
            LastUpdatedAt = now
        };

        await _accountRepository.AddAsync(account);
        await _accountRepository.SaveChangesAsync();

        return Map(account);
    }

    public async Task<IReadOnlyList<AccountDto>> GetAllAsync(Guid userId, GetAccountsQuery query)
    {
        var owned = await _accountRepository.GetAllByUserIdAsync(userId);
        var memberAccountIds = await _memberRepository.GetAccountIdsForUserAsync(userId);
        var memberAccounts = new List<Account>();
        foreach (var accountId in memberAccountIds)
        {
            var account = await _accountRepository.GetByIdAsync(accountId);
            if (account is not null)
                memberAccounts.Add(account);
        }

        var all = owned.Concat(memberAccounts).GroupBy(a => a.Id).Select(g => g.First()).ToList();
        return all.Select(Map).ToList();
    }

    public async Task<AccountDto?> GetByIdAsync(Guid userId, GetAccountByIdQuery query)
    {
        var account = await _accountRepository.GetByIdAsync(query.Id, userId);
        if (account is not null)
            return Map(account);

        var member = await _memberRepository.GetByUserAndAccountAsync(userId, query.Id);
        if (member is null)
            return null;

        var shared = await _accountRepository.GetByIdAsync(query.Id);
        return shared is null ? null : Map(shared);
    }

    public async Task<TransferResultDto> TransferAsync(Guid userId, TransferFundsCommand command)
    {
        if (command.SourceAccountId == command.DestinationAccountId)
            throw new DomainException("Source and destination accounts must be different.");

        if (command.Amount <= 0)
            throw new DomainException("Transfer amount must be greater than 0.");

        if (decimal.Round(command.Amount, 2) != command.Amount)
            throw new DomainException("Transfer amount can have at most 2 decimal places.");

        if (command.Date == default)
            throw new DomainException("Transfer date is required.");

        var source = await _accountRepository.GetByIdAsync(command.SourceAccountId, userId);
        if (source is null)
            throw new DomainException("Source account not found.");

        var destination = await _accountRepository.GetByIdAsync(command.DestinationAccountId, userId);
        if (destination is null)
            throw new DomainException("Destination account not found.");

        if (!source.CanDebit(command.Amount))
            throw new DomainException("Insufficient balance in the source account.");

        source.CurrentBalance -= command.Amount;
        source.LastUpdatedAt = DateTime.UtcNow;

        destination.CurrentBalance += command.Amount;
        destination.LastUpdatedAt = DateTime.UtcNow;

        await _accountRepository.SaveChangesAsync();

        return new TransferResultDto
        {
            SourceAccountId = source.Id,
            DestinationAccountId = destination.Id,
            Amount = command.Amount,
            SourceAccountBalance = source.CurrentBalance,
            DestinationAccountBalance = destination.CurrentBalance,
            Message = "Transfer completed successfully."
        };
    }

    private static AccountDto Map(Account account)
    {
        return new AccountDto
        {
            Id = account.Id,
            Name = account.Name,
            Type = account.Type,
            OpeningBalance = account.OpeningBalance,
            CurrentBalance = account.CurrentBalance,
            InstitutionName = account.InstitutionName,
            CreatedAt = account.CreatedAt,
            LastUpdatedAt = account.LastUpdatedAt
        };
    }
}

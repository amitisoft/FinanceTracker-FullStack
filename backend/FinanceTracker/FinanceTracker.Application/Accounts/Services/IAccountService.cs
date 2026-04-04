using FinanceTracker.Application.Accounts.Commands;
using FinanceTracker.Application.Accounts.DTOs;
using FinanceTracker.Application.Accounts.Queries;

namespace FinanceTracker.Application.Accounts.Services;

public interface IAccountService
{
    Task<AccountDto> CreateAsync(Guid userId, CreateAccountCommand command);

    Task<IReadOnlyList<AccountDto>> GetAllAsync(Guid userId, GetAccountsQuery query);

    Task<AccountDto?> GetByIdAsync(Guid userId, GetAccountByIdQuery query);

    Task<AccountDto?> UpdateAsync(Guid userId, Guid id, UpdateAccountCommand command);

    Task<TransferResultDto> TransferAsync(Guid userId, TransferFundsCommand command);
}

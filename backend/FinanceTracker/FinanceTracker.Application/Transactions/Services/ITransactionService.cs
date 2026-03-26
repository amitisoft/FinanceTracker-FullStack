using FinanceTracker.Application.Transactions.Commands;
using FinanceTracker.Application.Transactions.DTOs;
using FinanceTracker.Application.Transactions.Queries;

namespace FinanceTracker.Application.Transactions.Services;

public interface ITransactionService
{
    Task<TransactionDto> CreateAsync(Guid userId, CreateTransactionCommand command);

    Task<IReadOnlyList<TransactionDto>> GetAllAsync(Guid userId, GetTransactionsQuery query);

    Task<TransactionDto?> GetByIdAsync(Guid userId, GetTransactionByIdQuery query);

    Task<TransactionDto?> UpdateAsync(Guid userId, Guid id, UpdateTransactionCommand command);

    Task<bool> DeleteAsync(Guid userId, Guid id);
}
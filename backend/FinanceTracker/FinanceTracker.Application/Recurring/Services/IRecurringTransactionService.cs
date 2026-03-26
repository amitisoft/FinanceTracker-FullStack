using FinanceTracker.Application.Recurring.Commands;
using FinanceTracker.Application.Recurring.DTOs;

namespace FinanceTracker.Application.Recurring.Services;

public interface IRecurringTransactionService
{
    Task<IReadOnlyList<RecurringTransactionDto>> GetAllAsync(Guid userId);

    Task<RecurringTransactionDto> CreateAsync(Guid userId, CreateRecurringTransactionCommand command);

    Task<RecurringTransactionDto?> UpdateAsync(Guid userId, Guid id, UpdateRecurringTransactionCommand command);

    Task<bool> DeleteAsync(Guid userId, Guid id);

    Task<RecurringProcessResultDto> ProcessDueAsync(Guid userId, DateTime asOfDate);
}
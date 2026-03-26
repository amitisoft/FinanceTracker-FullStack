using FinanceTracker.Application.Categories.Commands;
using FinanceTracker.Application.Categories.DTOs;
using FinanceTracker.Application.Categories.Queries;

namespace FinanceTracker.Application.Categories.Services;

public interface ICategoryService
{
    Task<int> SeedDefaultsAsync(Guid userId);

    Task<CategoryDto> CreateAsync(Guid userId, CreateCategoryCommand command);

    Task<IReadOnlyList<CategoryDto>> GetAllAsync(Guid userId, GetCategoriesQuery query);

    Task<CategoryDto?> GetByIdAsync(Guid userId, GetCategoryByIdQuery query);

    Task<CategoryDto?> UpdateAsync(Guid userId, Guid id, UpdateCategoryCommand command);

    Task<bool> ArchiveAsync(Guid userId, Guid id);
}
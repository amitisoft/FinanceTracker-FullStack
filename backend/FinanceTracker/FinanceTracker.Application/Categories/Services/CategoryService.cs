using FinanceTracker.Application.Categories.Commands;
using FinanceTracker.Application.Categories.DTOs;
using FinanceTracker.Application.Categories.Queries;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Categories.Services;

public class CategoryService : ICategoryService
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "income",
        "expense"
    };

    private static readonly (string Name, string Type, string? Color, string? Icon)[] DefaultCategories =
    [
        ("Food", "expense", "#EF4444", "utensils"),
        ("Rent", "expense", "#7C3AED", "home"),
        ("Utilities", "expense", "#F59E0B", "bolt"),
        ("Transport", "expense", "#3B82F6", "car"),
        ("Entertainment", "expense", "#EC4899", "film"),
        ("Shopping", "expense", "#10B981", "bag-shopping"),
        ("Health", "expense", "#06B6D4", "heart-pulse"),
        ("Education", "expense", "#6366F1", "graduation-cap"),
        ("Travel", "expense", "#8B5CF6", "plane"),
        ("Subscriptions", "expense", "#F97316", "repeat"),
        ("Miscellaneous", "expense", "#6B7280", "ellipsis"),
        ("Salary", "income", "#22C55E", "wallet"),
        ("Freelance", "income", "#14B8A6", "briefcase"),
        ("Bonus", "income", "#84CC16", "gift"),
        ("Investment", "income", "#0EA5E9", "chart-line"),
        ("Gift", "income", "#E879F9", "gift"),
        ("Refund", "income", "#38BDF8", "rotate-ccw"),
        ("Other", "income", "#64748B", "circle")
    ];

    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<int> SeedDefaultsAsync(Guid userId)
    {
        var createdCount = 0;

        foreach (var item in DefaultCategories)
        {
            var exists = await _categoryRepository.ExistsByUserIdAndNameAndTypeAsync(
                userId,
                item.Name.Trim(),
                item.Type.Trim().ToLowerInvariant());

            if (exists)
                continue;

            await _categoryRepository.AddAsync(new Category
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = item.Name,
                Type = item.Type,
                Color = item.Color,
                Icon = item.Icon,
                IsArchived = false
            });

            createdCount++;
        }

        if (createdCount > 0)
            await _categoryRepository.SaveChangesAsync();

        return createdCount;
    }

    public async Task<CategoryDto> CreateAsync(Guid userId, CreateCategoryCommand command)
    {
        var normalized = NormalizeAndValidate(command.Name, command.Type, command.Color, command.Icon);

        var exists = await _categoryRepository.ExistsByUserIdAndNameAndTypeAsync(
            userId,
            normalized.Name,
            normalized.Type);

        if (exists)
            throw new DomainException("A category with the same name and type already exists.");

        var category = new Category
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = normalized.Name,
            Type = normalized.Type,
            Color = normalized.Color,
            Icon = normalized.Icon,
            IsArchived = false
        };

        await _categoryRepository.AddAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return Map(category);
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(Guid userId, GetCategoriesQuery query)
    {
        var type = NormalizeType(query.Type);

        if (query.Type is not null && type is null)
            throw new DomainException("Category type must be income or expense.");

        var categories = await _categoryRepository.GetAllByUserIdAsync(
            userId,
            type,
            query.IncludeArchived);

        return categories.Select(Map).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(Guid userId, GetCategoryByIdQuery query)
    {
        var category = await _categoryRepository.GetByIdAsync(query.Id, userId);
        return category is null ? null : Map(category);
    }

    public async Task<CategoryDto?> UpdateAsync(Guid userId, Guid id, UpdateCategoryCommand command)
    {
        var category = await _categoryRepository.GetByIdAsync(id, userId);

        if (category is null)
            return null;

        var normalized = NormalizeAndValidate(command.Name, command.Type, command.Color, command.Icon);

        var exists = await _categoryRepository.ExistsByUserIdAndNameAndTypeAsync(
            userId,
            normalized.Name,
            normalized.Type,
            id);

        if (exists)
            throw new DomainException("A category with the same name and type already exists.");

        category.Name = normalized.Name;
        category.Type = normalized.Type;
        category.Color = normalized.Color;
        category.Icon = normalized.Icon;

        await _categoryRepository.SaveChangesAsync();

        return Map(category);
    }

    public async Task<bool> ArchiveAsync(Guid userId, Guid id)
    {
        var category = await _categoryRepository.GetByIdAsync(id, userId);

        if (category is null)
            return false;

        if (!category.IsArchived)
        {
            category.IsArchived = true;
            await _categoryRepository.SaveChangesAsync();
        }

        return true;
    }

    private static (string Name, string Type, string? Color, string? Icon) NormalizeAndValidate(
        string? name,
        string? type,
        string? color,
        string? icon)
    {
        var normalizedName = name?.Trim() ?? string.Empty;
        var normalizedType = NormalizeType(type) ?? string.Empty;
        var normalizedColor = string.IsNullOrWhiteSpace(color) ? null : color.Trim();
        var normalizedIcon = string.IsNullOrWhiteSpace(icon) ? null : icon.Trim();

        if (string.IsNullOrWhiteSpace(normalizedName))
            throw new DomainException("Category name is required.");

        if (normalizedName.Length > 100)
            throw new DomainException("Category name cannot exceed 100 characters.");

        if (!AllowedTypes.Contains(normalizedType))
            throw new DomainException("Category type must be income or expense.");

        if (normalizedColor is not null && normalizedColor.Length > 20)
            throw new DomainException("Category color cannot exceed 20 characters.");

        if (normalizedIcon is not null && normalizedIcon.Length > 50)
            throw new DomainException("Category icon cannot exceed 50 characters.");

        return (normalizedName, normalizedType, normalizedColor, normalizedIcon);
    }

    private static string? NormalizeType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type))
            return null;

        return type.Trim().ToLowerInvariant();
    }

    private static CategoryDto Map(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Type = category.Type,
            Color = category.Color,
            Icon = category.Icon,
            IsArchived = category.IsArchived
        };
    }
}
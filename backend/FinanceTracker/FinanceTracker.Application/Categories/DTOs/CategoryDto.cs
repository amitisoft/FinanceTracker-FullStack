namespace FinanceTracker.Application.Categories.DTOs;

public class CategoryDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string? Color { get; set; }

    public string? Icon { get; set; }

    public bool IsArchived { get; set; }
}
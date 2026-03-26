namespace FinanceTracker.Application.Categories.Commands;

public class UpdateCategoryCommand
{
    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string? Color { get; set; }

    public string? Icon { get; set; }
}
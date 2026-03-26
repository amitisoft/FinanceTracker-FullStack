namespace FinanceTracker.Application.Categories.Queries;

public class GetCategoriesQuery
{
    public string? Type { get; set; }

    public bool IncludeArchived { get; set; } = false;
}
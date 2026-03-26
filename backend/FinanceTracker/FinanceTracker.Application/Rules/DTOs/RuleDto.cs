namespace FinanceTracker.Application.Rules.DTOs;

public class RuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public Guid? CategoryId { get; set; }
    public bool IsEnabled { get; set; }
}

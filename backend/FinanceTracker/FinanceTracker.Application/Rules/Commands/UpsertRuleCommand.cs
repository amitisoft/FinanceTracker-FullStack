using System.ComponentModel.DataAnnotations;

namespace FinanceTracker.Application.Rules.Commands;

public class UpsertRuleCommand
{
    [Required]
    [MaxLength(120)]
    public string? Name { get; set; }

    [Required]
    [MaxLength(50)]
    public string? Field { get; set; }

    [Required]
    [MaxLength(20)]
    public string? Operator { get; set; }

    [Required]
    [MaxLength(200)]
    public string? Value { get; set; }

    public Guid? CategoryId { get; set; }

    public bool IsEnabled { get; set; } = true;
}

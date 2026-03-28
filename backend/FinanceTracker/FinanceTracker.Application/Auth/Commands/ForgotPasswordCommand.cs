using System.ComponentModel.DataAnnotations;

namespace FinanceTracker.Application.Auth.Commands;

public class ForgotPasswordCommand
{
    [Required]
    [EmailAddress]
    public string? Email { get; set; }
}

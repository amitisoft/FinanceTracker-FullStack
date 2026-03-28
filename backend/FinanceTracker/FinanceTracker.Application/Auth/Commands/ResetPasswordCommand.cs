using System.ComponentModel.DataAnnotations;

namespace FinanceTracker.Application.Auth.Commands;

public class ResetPasswordCommand
{
    [Required]
    public string? Token { get; set; }

    [Required]
    public string? NewPassword { get; set; }
}

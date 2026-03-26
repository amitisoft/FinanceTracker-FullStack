using System.ComponentModel.DataAnnotations;

namespace FinanceTracker.Application.Accounts.Commands;

public class InviteAccountMemberCommand
{
    [Required]
    [EmailAddress]
    public string? Email { get; set; }

    [Required]
    public string? Role { get; set; }
}

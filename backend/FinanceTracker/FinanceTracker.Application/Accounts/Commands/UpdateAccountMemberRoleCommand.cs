using System.ComponentModel.DataAnnotations;

namespace FinanceTracker.Application.Accounts.Commands;

public class UpdateAccountMemberRoleCommand
{
    [Required]
    public string? Role { get; set; }

    public bool IsActive { get; set; } = true;
}

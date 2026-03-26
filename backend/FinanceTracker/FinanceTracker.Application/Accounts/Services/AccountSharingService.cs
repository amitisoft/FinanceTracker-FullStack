using FinanceTracker.Application.Accounts.Commands;
using FinanceTracker.Application.Accounts.DTOs;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Accounts.Services;

public interface IAccountSharingService
{
    Task<AccountInviteDto> InviteAsync(Guid ownerId, Guid accountId, InviteAccountMemberCommand command);
    Task<IReadOnlyList<AccountMemberDto>> GetMembersAsync(Guid userId, Guid accountId);
    Task<AccountMemberDto?> UpdateMemberAsync(Guid ownerId, Guid accountId, Guid memberUserId, UpdateAccountMemberRoleCommand command);
}

public class AccountSharingService : IAccountSharingService
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "owner",
        "editor",
        "viewer"
    };

    private readonly IAccountRepository _accountRepo;
    private readonly IUserRepository _userRepo;
    private readonly IAccountMemberRepository _memberRepo;
    private readonly IAccountInviteRepository _inviteRepo;

    public AccountSharingService(
        IAccountRepository accountRepo,
        IUserRepository userRepo,
        IAccountMemberRepository memberRepo,
        IAccountInviteRepository inviteRepo)
    {
        _accountRepo = accountRepo;
        _userRepo = userRepo;
        _memberRepo = memberRepo;
        _inviteRepo = inviteRepo;
    }

    public async Task<AccountInviteDto> InviteAsync(Guid ownerId, Guid accountId, InviteAccountMemberCommand command)
    {
        var account = await _accountRepo.GetByIdAsync(accountId, ownerId);
        if (account is null)
            throw new DomainException("Account not found or not owned by user.");

        var role = command.Role?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!AllowedRoles.Contains(role) || role == "owner")
            throw new DomainException("Role must be editor or viewer.");

        var email = command.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email is required.");

        var existingUser = await _userRepo.GetByEmailAsync(email);
        if (existingUser is not null)
        {
            var existingMember = await _memberRepo.GetByUserAndAccountAsync(existingUser.Id, accountId);
            if (existingMember is null)
            {
                var member = new AccountMember
                {
                    Id = Guid.NewGuid(),
                    AccountId = accountId,
                    UserId = existingUser.Id,
                    Role = role,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _memberRepo.AddAsync(member);
                await _memberRepo.SaveChangesAsync();
            }

            return new AccountInviteDto
            {
                Id = Guid.Empty,
                Email = email,
                Role = role,
                Status = "accepted",
                ExpiresAt = DateTime.UtcNow
            };
        }

        var invite = new AccountInvite
        {
            Id = Guid.NewGuid(),
            AccountId = accountId,
            CreatedByUserId = ownerId,
            Email = email,
            Role = role,
            Token = Guid.NewGuid().ToString("N"),
            Status = "pending",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        await _inviteRepo.AddAsync(invite);
        await _inviteRepo.SaveChangesAsync();

        return new AccountInviteDto
        {
            Id = invite.Id,
            Email = invite.Email,
            Role = invite.Role,
            Status = invite.Status,
            ExpiresAt = invite.ExpiresAt
        };
    }

    public async Task<IReadOnlyList<AccountMemberDto>> GetMembersAsync(Guid userId, Guid accountId)
    {
        var account = await _accountRepo.GetByIdAsync(accountId);
        if (account is null)
            throw new DomainException("Account not found.");

        if (account.UserId != userId)
        {
            var member = await _memberRepo.GetByUserAndAccountAsync(userId, accountId);
            if (member is null)
                throw new DomainException("Access denied.");
        }

        var members = await _memberRepo.GetByAccountIdAsync(accountId);
        return members.Select(m => new AccountMemberDto
        {
            UserId = m.UserId,
            Role = m.Role,
            IsActive = m.IsActive
        }).ToList();
    }

    public async Task<AccountMemberDto?> UpdateMemberAsync(Guid ownerId, Guid accountId, Guid memberUserId, UpdateAccountMemberRoleCommand command)
    {
        var account = await _accountRepo.GetByIdAsync(accountId, ownerId);
        if (account is null)
            throw new DomainException("Account not found or not owned by user.");

        var role = command.Role?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!AllowedRoles.Contains(role) || role == "owner")
            throw new DomainException("Role must be editor or viewer.");

        var member = await _memberRepo.GetByUserAndAccountAsync(memberUserId, accountId);
        if (member is null)
            return null;

        member.Role = role;
        member.IsActive = command.IsActive;
        member.UpdatedAt = DateTime.UtcNow;
        await _memberRepo.SaveChangesAsync();

        return new AccountMemberDto
        {
            UserId = member.UserId,
            Role = member.Role,
            IsActive = member.IsActive
        };
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FinanceTracker.Application.Accounts.Commands;
using FinanceTracker.Application.Accounts.DTOs;
using FinanceTracker.Application.Accounts.Queries;
using FinanceTracker.Application.Accounts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/accounts")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IAccountSharingService _accountSharingService;

    public AccountsController(IAccountService accountService, IAccountSharingService accountSharingService)
    {
        _accountService = accountService;
        _accountSharingService = accountSharingService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateAccountCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountService.CreateAsync(userId, command);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AccountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountService.GetAllAsync(userId, new GetAccountsQuery());

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountService.GetByIdAsync(
            userId,
            new GetAccountByIdQuery { Id = id });

        if (result is null)
            return NotFoundProblem("Account not found.");

        return Ok(result);
    }

    [HttpPost("transfer")]
    [ProducesResponseType(typeof(TransferResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Transfer([FromBody] TransferFundsCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountService.TransferAsync(userId, command);

        return Ok(result);
    }

    [HttpPost("{id:guid}/invite")]
    [ProducesResponseType(typeof(AccountInviteDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Invite(Guid id, [FromBody] InviteAccountMemberCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountSharingService.InviteAsync(userId, id, command);
        return CreatedAtAction(nameof(GetMembers), new { id }, result);
    }

    [HttpGet("{id:guid}/members")]
    [ProducesResponseType(typeof(IReadOnlyList<AccountMemberDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMembers(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountSharingService.GetMembersAsync(userId, id);
        return Ok(result);
    }

    [HttpGet("invites/pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingAccountInviteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPendingInvites()
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountSharingService.GetPendingInvitesAsync(userId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/invites/accept")]
    [ProducesResponseType(typeof(AccountMemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AcceptInvite(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountSharingService.AcceptInviteAsync(userId, id);
        return Ok(result);
    }

    [HttpPut("{id:guid}/members/{memberUserId:guid}")]
    [ProducesResponseType(typeof(AccountMemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMember(Guid id, Guid memberUserId, [FromBody] UpdateAccountMemberRoleCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _accountSharingService.UpdateMemberAsync(userId, id, memberUserId, command);
        if (result is null)
            return NotFoundProblem("Member not found.");

        return Ok(result);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(userIdValue, out userId);
    }

    private IActionResult UnauthorizedProblem()
    {
        return Unauthorized(new ProblemDetails
        {
            Title = "Unauthorized",
            Detail = "A valid bearer token is required.",
            Status = StatusCodes.Status401Unauthorized
        });
    }

    private IActionResult NotFoundProblem(string detail)
    {
        return NotFound(new ProblemDetails
        {
            Title = "Not Found",
            Detail = detail,
            Status = StatusCodes.Status404NotFound
        });
    }
}

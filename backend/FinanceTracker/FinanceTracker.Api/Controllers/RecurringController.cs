using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FinanceTracker.Application.Recurring.Commands;
using FinanceTracker.Application.Recurring.DTOs;
using FinanceTracker.Application.Recurring.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/recurring")]
public class RecurringController : ControllerBase
{
    private readonly IRecurringTransactionService _recurringService;

    public RecurringController(IRecurringTransactionService recurringService)
    {
        _recurringService = recurringService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RecurringTransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _recurringService.GetAllAsync(userId);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(RecurringTransactionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateRecurringTransactionCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _recurringService.CreateAsync(userId, command);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(RecurringTransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRecurringTransactionCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _recurringService.UpdateAsync(userId, id, command);
        if (result is null)
            return NotFoundProblem("Recurring transaction not found.");

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var deleted = await _recurringService.DeleteAsync(userId, id);
        if (!deleted)
            return NotFoundProblem("Recurring transaction not found.");

        return NoContent();
    }

    [HttpPost("process-due")]
    [ProducesResponseType(typeof(RecurringProcessResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessDue([FromQuery] DateTime? asOfDate)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var utcAsOfDate = NormalizeToUtc(asOfDate ?? DateTime.UtcNow);

        var result = await _recurringService.ProcessDueAsync(userId, utcAsOfDate);
        return Ok(result);
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
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
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FinanceTracker.Application.Budgets.Commands;
using FinanceTracker.Application.Budgets.DTOs;
using FinanceTracker.Application.Budgets.Queries;
using FinanceTracker.Application.Budgets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/budgets")]
public class BudgetsController : ControllerBase
{
    private readonly IBudgetService _budgetService;

    public BudgetsController(IBudgetService budgetService)
    {
        _budgetService = budgetService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BudgetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Get([FromQuery] GetBudgetsQuery query)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _budgetService.GetByMonthYearAsync(userId, query);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BudgetDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateBudgetCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _budgetService.CreateAsync(userId, command);
        return CreatedAtAction(nameof(Get), new { month = result.Month, year = result.Year }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(BudgetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBudgetCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _budgetService.UpdateAsync(userId, id, command);

        if (result is null)
            return NotFoundProblem("Budget not found.");

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var deleted = await _budgetService.DeleteAsync(userId, id);

        if (!deleted)
            return NotFoundProblem("Budget not found.");

        return NoContent();
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
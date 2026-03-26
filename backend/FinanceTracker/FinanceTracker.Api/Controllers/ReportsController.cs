using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FinanceTracker.Application.Reports.DTOs;
using FinanceTracker.Application.Reports.Queries;
using FinanceTracker.Application.Reports.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("category-spend")]
    [ProducesResponseType(typeof(IReadOnlyList<CategorySpendReportItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCategorySpend([FromQuery] GetCategorySpendReportQuery query)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _reportService.GetCategorySpendAsync(userId, query);
        return Ok(result);
    }

    [HttpGet("income-vs-expense")]
    [ProducesResponseType(typeof(IReadOnlyList<IncomeVsExpenseReportItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetIncomeVsExpense([FromQuery] GetIncomeVsExpenseReportQuery query)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _reportService.GetIncomeVsExpenseAsync(userId, query);
        return Ok(result);
    }

    [HttpGet("account-balance-trend")]
    [ProducesResponseType(typeof(IReadOnlyList<AccountBalanceTrendItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAccountBalanceTrend([FromQuery] GetAccountBalanceTrendQuery query)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _reportService.GetAccountBalanceTrendAsync(userId, query);
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
}
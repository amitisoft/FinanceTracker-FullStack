using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FinanceTracker.Application.Demo.DTOs;
using FinanceTracker.Application.Demo.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/demo")]
public class DemoController : ControllerBase
{
    private readonly IDemoSeedService _demoSeedService;

    public DemoController(IDemoSeedService demoSeedService)
    {
        _demoSeedService = demoSeedService;
    }

    [HttpPost("seed")]
    [ProducesResponseType(typeof(DemoSeedResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Seed()
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _demoSeedService.SeedAsync(userId, DateTime.UtcNow);
        return Ok(result);
    }

    [HttpPost("clear")]
    [ProducesResponseType(typeof(DemoClearResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Clear()
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _demoSeedService.ClearAsync(userId);
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

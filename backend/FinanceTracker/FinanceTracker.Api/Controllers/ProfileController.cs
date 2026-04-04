using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FinanceTracker.Application.Profile.Commands;
using FinanceTracker.Application.Profile.DTOs;
using FinanceTracker.Application.Profile.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profile;

    public ProfileController(IProfileService profile)
    {
        _profile = profile;
    }

    [HttpGet]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Get()
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _profile.GetAsync(userId);
        return Ok(result);
    }

    [HttpPut]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update([FromBody] UpdateProfileCommand command)
    {
        if (!TryGetUserId(out var userId))
            return UnauthorizedProblem();

        var result = await _profile.UpdateAsync(userId, command);
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


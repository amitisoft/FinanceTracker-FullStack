using FinanceTracker.Application.Insights.DTOs;
using FinanceTracker.Application.Insights.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Route("api/insights")]
[Authorize]
public class InsightsController : ControllerBase
{
    private readonly IHealthScoreService _healthScoreService;
    private readonly IInsightsService _insightsService;

    public InsightsController(IHealthScoreService healthScoreService, IInsightsService insightsService)
    {
        _healthScoreService = healthScoreService;
        _insightsService = insightsService;
    }

    [HttpGet("health-score")]
    public async Task<ActionResult<HealthScoreDto>> GetHealthScore()
    {
        var userId = GetUserId();
        var result = await _healthScoreService.GetAsync(userId, DateTime.UtcNow);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InsightMessageDto>>> GetInsights()
    {
        var userId = GetUserId();
        var result = await _insightsService.GetInsightsAsync(userId, DateTime.UtcNow);
        return Ok(result);
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
        return Guid.Parse(sub);
    }
}

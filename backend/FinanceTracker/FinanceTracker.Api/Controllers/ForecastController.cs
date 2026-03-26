using FinanceTracker.Application.Forecast.DTOs;
using FinanceTracker.Application.Forecast.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Route("api/forecast")]
[Authorize]
public class ForecastController : ControllerBase
{
    private readonly IForecastService _forecastService;

    public ForecastController(IForecastService forecastService)
    {
        _forecastService = forecastService;
    }

    [HttpGet("month")]
    public async Task<ActionResult<MonthlyForecastDto>> GetMonth()
    {
        var userId = GetUserId();
        var result = await _forecastService.GetMonthlyAsync(userId, DateTime.UtcNow);
        return Ok(result);
    }

    [HttpGet("daily")]
    public async Task<ActionResult<IReadOnlyList<DailyForecastPointDto>>> GetDaily([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var userId = GetUserId();
        var today = DateTime.UtcNow.Date;
        var startDate = start?.Date ?? today;
        var endDate = end?.Date ?? new DateTime(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));
        var result = await _forecastService.GetDailyAsync(userId, startDate, endDate);
        return Ok(result);
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
        return Guid.Parse(sub);
    }
}

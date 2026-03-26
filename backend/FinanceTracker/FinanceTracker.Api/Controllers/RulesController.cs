using FinanceTracker.Application.Rules.Commands;
using FinanceTracker.Application.Rules.DTOs;
using FinanceTracker.Application.Rules.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceTracker.Api.Controllers;

[ApiController]
[Route("api/rules")]
[Authorize]
public class RulesController : ControllerBase
{
    private readonly IRuleService _ruleService;

    public RulesController(IRuleService ruleService)
    {
        _ruleService = ruleService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RuleDto>>> GetAll()
    {
        var userId = GetUserId();
        var rules = await _ruleService.GetAllAsync(userId);
        return Ok(rules);
    }

    [HttpPost]
    public async Task<ActionResult<RuleDto>> Create([FromBody] UpsertRuleCommand command)
    {
        var userId = GetUserId();
        var result = await _ruleService.CreateAsync(userId, command);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RuleDto>> Update(Guid id, [FromBody] UpsertRuleCommand command)
    {
        var userId = GetUserId();
        var result = await _ruleService.UpdateAsync(userId, id, command);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var deleted = await _ruleService.DeleteAsync(userId, id);
        return deleted ? NoContent() : NotFound();
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
        return Guid.Parse(sub);
    }
}

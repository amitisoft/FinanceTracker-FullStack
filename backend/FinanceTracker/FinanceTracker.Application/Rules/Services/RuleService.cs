using FinanceTracker.Application.Rules.Commands;
using FinanceTracker.Application.Rules.DTOs;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Exceptions;
using FinanceTracker.Domain.Interfaces;

namespace FinanceTracker.Application.Rules.Services;

public interface IRuleService
{
    Task<IReadOnlyList<RuleDto>> GetAllAsync(Guid userId);
    Task<RuleDto> CreateAsync(Guid userId, UpsertRuleCommand command);
    Task<RuleDto?> UpdateAsync(Guid userId, Guid id, UpsertRuleCommand command);
    Task<bool> DeleteAsync(Guid userId, Guid id);
    Task<Rule?> GetMatchingRuleAsync(Guid userId, string merchant, string note, decimal amount, string type);
}

public class RuleService : IRuleService
{
    private readonly IRuleRepository _ruleRepo;

    public RuleService(IRuleRepository ruleRepo)
    {
        _ruleRepo = ruleRepo;
    }

    public async Task<IReadOnlyList<RuleDto>> GetAllAsync(Guid userId)
    {
        var rules = await _ruleRepo.GetAllByUserIdAsync(userId);
        return rules.Select(Map).ToList();
    }

    public async Task<RuleDto> CreateAsync(Guid userId, UpsertRuleCommand command)
    {
        Validate(command);

        var rule = new Rule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = command.Name!.Trim(),
            Field = command.Field!.Trim().ToLowerInvariant(),
            Operator = command.Operator!.Trim().ToLowerInvariant(),
            Value = command.Value!.Trim(),
            CategoryId = command.CategoryId,
            IsEnabled = command.IsEnabled,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _ruleRepo.AddAsync(rule);
        await _ruleRepo.SaveChangesAsync();
        return Map(rule);
    }

    public async Task<RuleDto?> UpdateAsync(Guid userId, Guid id, UpsertRuleCommand command)
    {
        Validate(command);
        var existing = await _ruleRepo.GetByIdAsync(id, userId);
        if (existing is null) return null;

        existing.Name = command.Name!.Trim();
        existing.Field = command.Field!.Trim().ToLowerInvariant();
        existing.Operator = command.Operator!.Trim().ToLowerInvariant();
        existing.Value = command.Value!.Trim();
        existing.CategoryId = command.CategoryId;
        existing.IsEnabled = command.IsEnabled;
        existing.UpdatedAt = DateTime.UtcNow;

        await _ruleRepo.SaveChangesAsync();
        return Map(existing);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id)
    {
        var existing = await _ruleRepo.GetByIdAsync(id, userId);
        if (existing is null) return false;
        _ruleRepo.Remove(existing);
        await _ruleRepo.SaveChangesAsync();
        return true;
    }

    public async Task<Rule?> GetMatchingRuleAsync(Guid userId, string merchant, string note, decimal amount, string type)
    {
        var rules = await _ruleRepo.GetAllByUserIdAsync(userId);
        foreach (var rule in rules.Where(r => r.IsEnabled))
        {
            if (Matches(rule, merchant, note, amount, type))
                return rule;
        }
        return null;
    }

    private static bool Matches(Rule rule, string merchant, string note, decimal amount, string type)
    {
        var value = rule.Value;
        return rule.Field switch
        {
            "merchant" => Compare(rule.Operator, merchant, value),
            "note" => Compare(rule.Operator, note, value),
            "amount" => CompareAmount(rule.Operator, amount, value),
            "type" => Compare(rule.Operator, type, value),
            _ => false
        };
    }

    private static bool Compare(string op, string actual, string expected)
    {
        actual ??= string.Empty;
        expected ??= string.Empty;
        return op switch
        {
            "equals" => string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase),
            "contains" => actual.Contains(expected, StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    private static bool CompareAmount(string op, decimal amount, string expected)
    {
        if (!decimal.TryParse(expected, out var target)) return false;
        return op switch
        {
            "gt" => amount > target,
            "gte" => amount >= target,
            "lt" => amount < target,
            "lte" => amount <= target,
            "equals" => amount == target,
            _ => false
        };
    }

    private static void Validate(UpsertRuleCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
            throw new DomainException("Rule name is required.");
        if (string.IsNullOrWhiteSpace(command.Field))
            throw new DomainException("Field is required.");
        if (string.IsNullOrWhiteSpace(command.Operator))
            throw new DomainException("Operator is required.");
        if (string.IsNullOrWhiteSpace(command.Value))
            throw new DomainException("Value is required.");
    }

    private static RuleDto Map(Rule rule) => new()
    {
        Id = rule.Id,
        Name = rule.Name,
        Field = rule.Field,
        Operator = rule.Operator,
        Value = rule.Value,
        CategoryId = rule.CategoryId,
        IsEnabled = rule.IsEnabled
    };
}

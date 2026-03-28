using FinanceTracker.Application.Accounts.Commands;
using FinanceTracker.Application.Accounts.Services;
using FinanceTracker.Application.Budgets.Commands;
using FinanceTracker.Application.Budgets.Services;
using FinanceTracker.Application.Categories.Services;
using FinanceTracker.Application.Demo.DTOs;
using FinanceTracker.Application.Demo.Services;
using FinanceTracker.Application.Goals.Commands;
using FinanceTracker.Application.Goals.Services;
using FinanceTracker.Application.Recurring.Commands;
using FinanceTracker.Application.Recurring.Services;
using FinanceTracker.Application.Rules.Commands;
using FinanceTracker.Application.Rules.Services;
using FinanceTracker.Application.Transactions.Commands;
using FinanceTracker.Application.Transactions.Services;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Domain.Interfaces;
using System.Text.Json;

namespace FinanceTracker.Application.Demo.Services;

public class DemoSeedService : IDemoSeedService
{
    private const string DemoPrefix = "Demo - ";

    private readonly ICategoryService _categoryService;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly IAccountService _accountService;
    private readonly ITransactionService _transactionService;
    private readonly IBudgetService _budgetService;
    private readonly IGoalService _goalService;
    private readonly IRecurringTransactionService _recurringService;
    private readonly IRuleService _ruleService;
    private readonly IDemoSeedStateRepository _demoSeedStateRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IBudgetRepository _budgetRepository;
    private readonly IRuleRepository _ruleRepository;
    private readonly IRecurringTransactionRepository _recurringRepository;
    private readonly IGoalRepository _goalRepository;

    public DemoSeedService(
        ICategoryService categoryService,
        ICategoryRepository categoryRepository,
        IAccountRepository accountRepository,
        IAccountService accountService,
        ITransactionService transactionService,
        IBudgetService budgetService,
        IGoalService goalService,
        IRecurringTransactionService recurringService,
        IRuleService ruleService,
        IDemoSeedStateRepository demoSeedStateRepository,
        ITransactionRepository transactionRepository,
        IBudgetRepository budgetRepository,
        IRuleRepository ruleRepository,
        IRecurringTransactionRepository recurringRepository,
        IGoalRepository goalRepository)
    {
        _categoryService = categoryService;
        _categoryRepository = categoryRepository;
        _accountRepository = accountRepository;
        _accountService = accountService;
        _transactionService = transactionService;
        _budgetService = budgetService;
        _goalService = goalService;
        _recurringService = recurringService;
        _ruleService = ruleService;
        _demoSeedStateRepository = demoSeedStateRepository;
        _transactionRepository = transactionRepository;
        _budgetRepository = budgetRepository;
        _ruleRepository = ruleRepository;
        _recurringRepository = recurringRepository;
        _goalRepository = goalRepository;
    }

    public async Task<DemoSeedResultDto> SeedAsync(Guid userId, DateTime utcNow)
    {
        var existingAccounts = await _accountRepository.GetAllByUserIdAsync(userId);
        if (existingAccounts.Any(a => a.Name.StartsWith(DemoPrefix, StringComparison.OrdinalIgnoreCase)))
        {
            return new DemoSeedResultDto
            {
                AlreadySeeded = true,
                Message = "Demo data already exists for this account."
            };
        }

        // Ensure default categories exist
        await _categoryService.SeedDefaultsAsync(userId);
        var categories = await _categoryRepository.GetAllByUserIdAsync(userId, null, true);

        var payload = new DemoSeedPayload();

        Guid GetCategoryId(string name, string type)
        {
            var match = categories.FirstOrDefault(c =>
                c.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                c.Type.Equals(type, StringComparison.OrdinalIgnoreCase));
            if (match is null)
                throw new InvalidOperationException($"Missing category '{name}' ({type}).");
            return match.Id;
        }

        var now = DateTime.SpecifyKind(utcNow, DateTimeKind.Utc);
        var today = now.Date;
        var month = today.Month;
        var year = today.Year;

        // Accounts
        var bank = await _accountService.CreateAsync(userId, new CreateAccountCommand
        {
            Name = $"{DemoPrefix}HDFC Bank",
            Type = "bank",
            OpeningBalance = 25000,
            InstitutionName = "HDFC"
        });
        payload.AccountIds.Add(bank.Id);

        var cash = await _accountService.CreateAsync(userId, new CreateAccountCommand
        {
            Name = $"{DemoPrefix}Cash Wallet",
            Type = "cash",
            OpeningBalance = 2000,
            InstitutionName = null
        });
        payload.AccountIds.Add(cash.Id);

        var card = await _accountService.CreateAsync(userId, new CreateAccountCommand
        {
            Name = $"{DemoPrefix}Credit Card",
            Type = "credit_card",
            OpeningBalance = 5000,
            InstitutionName = "Demo Card"
        });
        payload.AccountIds.Add(card.Id);

        // Rules (auto-categorize)
        var transportCategoryId = GetCategoryId("Transport", "expense");
        var rule = await _ruleService.CreateAsync(userId, new UpsertRuleCommand
        {
            Name = $"{DemoPrefix}Auto categorize Uber",
            Field = "merchant",
            Operator = "contains",
            Value = "Uber",
            CategoryId = transportCategoryId,
            IsEnabled = true
        });
        payload.RuleIds.Add(rule.Id);

        // Budgets (current month)
        var budgetsCreated = 0;
        foreach (var (cat, amount) in new[]
        {
            ("Food", 8000m),
            ("Transport", 2500m),
            ("Subscriptions", 1200m),
            ("Education", 10000m),
        })
        {
            var categoryId = GetCategoryId(cat, "expense");

            // Do not overwrite the user's real budgets; skip if a budget already exists.
            var existingBudget = await _budgetRepository.GetByCategoryMonthYearAsync(userId, categoryId, month, year);
            if (existingBudget is not null)
                continue;

            var budget = await _budgetService.CreateAsync(userId, new CreateBudgetCommand
            {
                CategoryId = categoryId,
                Month = month,
                Year = year,
                Amount = amount,
                AlertThresholdPercent = 80
            });
            payload.BudgetIds.Add(budget.Id);
            budgetsCreated++;
        }

        // Goals
        var goal = await _goalService.CreateAsync(userId, new CreateGoalCommand
        {
            Name = "Emergency Fund",
            TargetAmount = 100000,
            CurrentAmount = 25000,
            TargetDate = today.AddMonths(6),
            LinkedAccountId = bank.Id,
            Icon = "🛟",
            Color = "#22d3ee"
        });
        payload.GoalIds.Add(goal.Id);

        // Recurring (start tomorrow so it shows as upcoming)
        var rentCategoryId = GetCategoryId("Rent", "expense");
        var subsCategoryId = GetCategoryId("Subscriptions", "expense");
        var salaryCategoryId = GetCategoryId("Salary", "income");

        var tomorrow = today.AddDays(1);
        var rentRecurring = await _recurringService.CreateAsync(userId, new CreateRecurringTransactionCommand
        {
            Title = "Rent",
            Type = "expense",
            Amount = 15000,
            CategoryId = rentCategoryId,
            AccountId = bank.Id,
            Frequency = "monthly",
            StartDate = tomorrow,
            EndDate = null,
            AutoCreateTransaction = true
        });
        payload.RecurringIds.Add(rentRecurring.Id);

        var netflixRecurring = await _recurringService.CreateAsync(userId, new CreateRecurringTransactionCommand
        {
            Title = "Netflix",
            Type = "expense",
            Amount = 499,
            CategoryId = subsCategoryId,
            AccountId = card.Id,
            Frequency = "monthly",
            StartDate = tomorrow,
            EndDate = null,
            AutoCreateTransaction = true
        });
        payload.RecurringIds.Add(netflixRecurring.Id);

        var salaryRecurring = await _recurringService.CreateAsync(userId, new CreateRecurringTransactionCommand
        {
            Title = "Salary",
            Type = "income",
            Amount = 60000,
            CategoryId = salaryCategoryId,
            AccountId = bank.Id,
            Frequency = "monthly",
            StartDate = tomorrow,
            EndDate = null,
            AutoCreateTransaction = true
        });
        payload.RecurringIds.Add(salaryRecurring.Id);

        // Transactions (last ~60 days)
        var foodCategoryId = GetCategoryId("Food", "expense");
        var utilitiesCategoryId = GetCategoryId("Utilities", "expense");
        var educationCategoryId = GetCategoryId("Education", "expense");
        var entertainmentCategoryId = GetCategoryId("Entertainment", "expense");

        var transactionsCreated = 0;

        // Seed 2 salary payments in past to make balances realistic
        foreach (var dt in new[] { today.AddDays(-45), today.AddDays(-15) })
        {
            var tx = await _transactionService.CreateAsync(userId, new CreateTransactionCommand
            {
                Type = "income",
                Amount = 60000,
                Date = dt,
                AccountId = bank.Id,
                CategoryId = salaryCategoryId,
                Merchant = "Employer Inc",
                Note = "Monthly salary",
                PaymentMethod = "bank_transfer"
            });
            payload.TransactionIds.Add(tx.Id);
            transactionsCreated++;
        }

        foreach (var item in new (int OffsetDays, string Type, decimal Amount, Guid AccountId, Guid? CategoryId, string Merchant, string Note, string Payment)[]
        {
            (-40, "expense", 820, bank.Id, foodCategoryId, "Grocery Mart", "Weekly groceries", "card"),
            (-38, "expense", 150, cash.Id, foodCategoryId, "Tea stall", "Snacks", "cash"),
            (-35, "expense", 1999, card.Id, entertainmentCategoryId, "BookMyShow", "Movie night", "card"),
            (-32, "expense", 1200, bank.Id, utilitiesCategoryId, "Electricity Board", "Power bill", "upi"),
            (-29, "expense", 650, bank.Id, null, "Uber", "Airport ride", "upi"), // should auto-categorize via rule
            (-27, "expense", 3200, bank.Id, educationCategoryId, "Course Platform", "Skill upgrade", "card"),
            (-24, "expense", 540, cash.Id, foodCategoryId, "Cafeteria", "Lunch", "cash"),
            (-21, "expense", 850, bank.Id, foodCategoryId, "Grocery Mart", "Groceries", "card"),
            (-18, "expense", 399, card.Id, subsCategoryId, "Spotify", "Subscription", "card"),
            (-16, "expense", 220, cash.Id, transportCategoryId, "Metro", "Commute", "cash"),
            (-13, "expense", 1800, bank.Id, utilitiesCategoryId, "Gas Agency", "Cooking gas", "upi"),
            (-10, "expense", 1250, bank.Id, entertainmentCategoryId, "Restaurant", "Dinner", "card"),
            (-8, "expense", 700, bank.Id, foodCategoryId, "Grocery Mart", "Groceries", "card"),
            (-6, "expense", 300, cash.Id, foodCategoryId, "Coffee", "Cafe", "cash"),
            (-4, "expense", 999, card.Id, subsCategoryId, "Prime Video", "Subscription", "card"),
            (-2, "expense", 420, bank.Id, transportCategoryId, "Uber", "City ride", "upi"), // should auto-categorize via rule
        })
        {
            var tx = await _transactionService.CreateAsync(userId, new CreateTransactionCommand
            {
                Type = item.Type,
                Amount = item.Amount,
                Date = today.AddDays(item.OffsetDays),
                AccountId = item.AccountId,
                CategoryId = item.CategoryId,
                Merchant = item.Merchant,
                Note = item.Note,
                PaymentMethod = item.Payment
            });
            payload.TransactionIds.Add(tx.Id);
            transactionsCreated++;
        }

        await _demoSeedStateRepository.UpsertAsync(new DemoSeedState
        {
            UserId = userId,
            SeededAtUtc = DateTime.UtcNow,
            PayloadJson = JsonSerializer.Serialize(payload)
        });
        await _demoSeedStateRepository.SaveChangesAsync();

        return new DemoSeedResultDto
        {
            AlreadySeeded = false,
            AccountsCreated = 3,
            TransactionsCreated = transactionsCreated,
            BudgetsCreated = budgetsCreated,
            GoalsCreated = 1,
            RecurringCreated = 3,
            RulesCreated = 1,
            Message = "Demo data seeded successfully."
        };
    }

    public async Task<DemoClearResultDto> ClearAsync(Guid userId)
    {
        var state = await _demoSeedStateRepository.GetByUserIdAsync(userId);
        DemoSeedPayload payload;

        if (state is null || string.IsNullOrWhiteSpace(state.PayloadJson))
        {
            // Best-effort fallback: only remove demo-owned accounts and directly attached data.
            var accounts = await _accountRepository.GetAllByUserIdAsync(userId);
            var demoAccountIds = accounts
                .Where(a => a.Name.StartsWith(DemoPrefix, StringComparison.OrdinalIgnoreCase))
                .Select(a => a.Id)
                .ToList();

            if (demoAccountIds.Count == 0)
            {
                return new DemoClearResultDto
                {
                    Cleared = false,
                    Message = "No demo data found to clear."
                };
            }

            payload = new DemoSeedPayload
            {
                AccountIds = demoAccountIds
            };

            var allTransactions = await _transactionRepository.GetAllByUserIdAsync(userId);
            payload.TransactionIds = allTransactions
                .Where(t => demoAccountIds.Contains(t.AccountId))
                .Select(t => t.Id)
                .ToList();

            var allRecurring = await _recurringRepository.GetAllByUserIdAsync(userId);
            payload.RecurringIds = allRecurring
                .Where(r => r.AccountId.HasValue && demoAccountIds.Contains(r.AccountId.Value))
                .Select(r => r.Id)
                .ToList();

            var allGoals = await _goalRepository.GetAllByUserIdAsync(userId);
            payload.GoalIds = allGoals
                .Where(g => g.LinkedAccountId.HasValue && demoAccountIds.Contains(g.LinkedAccountId.Value))
                .Select(g => g.Id)
                .ToList();
        }
        else
        {
            payload = JsonSerializer.Deserialize<DemoSeedPayload>(state.PayloadJson) ?? new DemoSeedPayload();
        }

        var result = new DemoClearResultDto();

        foreach (var txId in payload.TransactionIds.Distinct())
        {
            var tx = await _transactionRepository.GetByIdAsync(txId, userId);
            if (tx is null) continue;
            _transactionRepository.Remove(tx);
            result.TransactionsDeleted++;
        }

        foreach (var recurringId in payload.RecurringIds.Distinct())
        {
            var recurring = await _recurringRepository.GetByIdAsync(recurringId, userId);
            if (recurring is null) continue;
            _recurringRepository.Remove(recurring);
            result.RecurringDeleted++;
        }

        foreach (var budgetId in payload.BudgetIds.Distinct())
        {
            var budget = await _budgetRepository.GetByIdAsync(budgetId, userId);
            if (budget is null) continue;
            _budgetRepository.Remove(budget);
            result.BudgetsDeleted++;
        }

        foreach (var ruleId in payload.RuleIds.Distinct())
        {
            var rule = await _ruleRepository.GetByIdAsync(ruleId, userId);
            if (rule is null) continue;
            _ruleRepository.Remove(rule);
            result.RulesDeleted++;
        }

        foreach (var goalId in payload.GoalIds.Distinct())
        {
            var goal = await _goalRepository.GetByIdAsync(goalId, userId);
            if (goal is null) continue;
            _goalRepository.Remove(goal);
            result.GoalsDeleted++;
        }

        foreach (var accountId in payload.AccountIds.Distinct())
        {
            var account = await _accountRepository.GetByIdAsync(accountId, userId);
            if (account is null) continue;
            _accountRepository.Remove(account);
            result.AccountsDeleted++;
        }

        if (state is not null)
            _demoSeedStateRepository.Remove(state);

        await _demoSeedStateRepository.SaveChangesAsync();

        result.Cleared = result.AccountsDeleted > 0 ||
                         result.TransactionsDeleted > 0 ||
                         result.BudgetsDeleted > 0 ||
                         result.GoalsDeleted > 0 ||
                         result.RecurringDeleted > 0 ||
                         result.RulesDeleted > 0;

        result.Message = result.Cleared ? "Demo data cleared." : "No demo data found to clear.";
        return result;
    }

    private class DemoSeedPayload
    {
        public List<Guid> AccountIds { get; set; } = new();
        public List<Guid> TransactionIds { get; set; } = new();
        public List<Guid> BudgetIds { get; set; } = new();
        public List<Guid> GoalIds { get; set; } = new();
        public List<Guid> RecurringIds { get; set; } = new();
        public List<Guid> RuleIds { get; set; } = new();
    }
}

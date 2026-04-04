using FinanceTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Persistence;

public class FinanceTrackerDbContext : DbContext
{
    public FinanceTrackerDbContext(DbContextOptions<FinanceTrackerDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<RecurringTransaction> RecurringTransactions => Set<RecurringTransaction>();
    public DbSet<Rule> Rules => Set<Rule>();
    public DbSet<AccountMember> AccountMembers => Set<AccountMember>();
    public DbSet<AccountInvite> AccountInvites => Set<AccountInvite>();
    public DbSet<AccountActivity> AccountActivities => Set<AccountActivity>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<DemoSeedState> DemoSeedStates => Set<DemoSeedState>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Account>(entity =>
        {
            entity.Property(a => a.Name).HasMaxLength(100).IsRequired();
            entity.Property(a => a.Type).HasMaxLength(30).IsRequired();
            entity.Property(a => a.InstitutionName).HasMaxLength(120);
            entity.Property(a => a.OpeningBalance).HasPrecision(12, 2);
            entity.Property(a => a.CurrentBalance).HasPrecision(12, 2);

            entity.HasOne(a => a.User)
                .WithMany(u => u.Accounts)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
            entity.Property(c => c.Type).HasMaxLength(20).IsRequired();
            entity.Property(c => c.Color).HasMaxLength(20);
            entity.Property(c => c.Icon).HasMaxLength(50);
            entity.Property(c => c.IsArchived).HasDefaultValue(false);

            entity.HasIndex(c => new { c.UserId, c.Type, c.Name });

            entity.HasOne(c => c.User)
                .WithMany(u => u.Categories)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.Property(t => t.Type).HasMaxLength(20).IsRequired();
            entity.Property(t => t.Amount).HasPrecision(12, 2);
            entity.Property(t => t.Merchant).HasMaxLength(200);
            entity.Property(t => t.PaymentMethod).HasMaxLength(50);
            entity.Property(t => t.Tags).HasColumnType("text[]");

            entity.HasOne(t => t.User)
                .WithMany(u => u.Transactions)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.DestinationAccount)
                .WithMany()
                .HasForeignKey(t => t.DestinationAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.Category)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.Property(b => b.Amount).HasPrecision(12, 2);

            entity.HasIndex(b => new { b.UserId, b.CategoryId, b.Month, b.Year }).IsUnique();

            entity.HasOne(b => b.User)
                .WithMany(u => u.Budgets)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Category)
                .WithMany(c => c.Budgets)
                .HasForeignKey(b => b.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Goal>(entity =>
        {
            entity.Property(g => g.Name).HasMaxLength(120).IsRequired();
            entity.Property(g => g.TargetAmount).HasPrecision(12, 2);
            entity.Property(g => g.CurrentAmount).HasPrecision(12, 2);
            entity.Property(g => g.Icon).HasMaxLength(50);
            entity.Property(g => g.Color).HasMaxLength(20);
            entity.Property(g => g.Status).HasMaxLength(30).IsRequired();

            entity.HasOne(g => g.User)
                .WithMany(u => u.Goals)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(g => g.LinkedAccount)
                .WithMany(a => a.Goals)
                .HasForeignKey(g => g.LinkedAccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RecurringTransaction>(entity =>
        {
            entity.Property(r => r.Title).HasMaxLength(120).IsRequired();
            entity.Property(r => r.Type).HasMaxLength(20).IsRequired();
            entity.Property(r => r.Amount).HasPrecision(12, 2);
            entity.Property(r => r.Frequency).HasMaxLength(20).IsRequired();
            entity.Property(r => r.AutoCreateTransaction).HasDefaultValue(true);
            entity.Property(r => r.IsPaused).HasDefaultValue(false);

            entity.HasOne(r => r.User)
                .WithMany(u => u.RecurringTransactions)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.Category)
                .WithMany(c => c.RecurringTransactions)
                .HasForeignKey(r => r.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Account)
                .WithMany(a => a.RecurringTransactions)
                .HasForeignKey(r => r.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Rule>(entity =>
        {
            entity.Property(r => r.Name).HasMaxLength(120).IsRequired();
            entity.Property(r => r.Field).HasMaxLength(50).IsRequired();
            entity.Property(r => r.Operator).HasMaxLength(20).IsRequired();
            entity.Property(r => r.Value).HasMaxLength(200).IsRequired();
            entity.Property(r => r.IsEnabled).HasDefaultValue(true);

            entity.HasOne(r => r.Category)
                .WithMany(c => c.Rules)
                .HasForeignKey(r => r.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(r => new { r.UserId, r.Name });
        });

        modelBuilder.Entity<AccountMember>(entity =>
        {
            entity.Property(m => m.Role).HasMaxLength(20).IsRequired();
            entity.Property(m => m.IsActive).HasDefaultValue(true);

            entity.HasIndex(m => new { m.AccountId, m.UserId }).IsUnique();

            entity.HasOne(m => m.Account)
                .WithMany(a => a.Members)
                .HasForeignKey(m => m.AccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AccountInvite>(entity =>
        {
            entity.Property(i => i.Email).HasMaxLength(200).IsRequired();
            entity.Property(i => i.Role).HasMaxLength(20).IsRequired();
            entity.Property(i => i.Token).HasMaxLength(120).IsRequired();
            entity.Property(i => i.Status).HasMaxLength(20).IsRequired();

            entity.HasIndex(i => new { i.AccountId, i.Email });

            entity.HasOne(i => i.Account)
                .WithMany(a => a.Invites)
                .HasForeignKey(i => i.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AccountActivity>(entity =>
        {
            entity.Property(a => a.Action).HasMaxLength(20).IsRequired();
            entity.Property(a => a.EntityType).HasMaxLength(50).IsRequired();

            entity.HasOne(a => a.Account)
                .WithMany(a => a.Activities)
                .HasForeignKey(a => a.AccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.Property(t => t.Token).HasMaxLength(120).IsRequired();
            entity.HasIndex(t => t.Token).IsUnique();

            entity.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Email).HasMaxLength(200).IsRequired();
            entity.Property(u => u.DisplayName).HasMaxLength(60);
            entity.Property(u => u.AvatarUrl).HasMaxLength(500);
            entity.Property(u => u.AvatarColor).HasMaxLength(20);
            entity.Property(u => u.IsEmailVerified).HasDefaultValue(true);
        });

        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.Property(t => t.Token).HasMaxLength(120).IsRequired();
            entity.HasIndex(t => t.Token).IsUnique();

            entity.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DemoSeedState>(entity =>
        {
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.PayloadJson).IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

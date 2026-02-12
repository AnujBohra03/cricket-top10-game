using Microsoft.EntityFrameworkCore;
using CricketTop10Game.Api.Models;

namespace CricketTop10Game.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<QuestionEntity> Questions => Set<QuestionEntity>();
    public DbSet<AnswerEntity> Answers => Set<AnswerEntity>();
    public DbSet<GameSession> GameSessions => Set<GameSession>();
    public DbSet<SessionGuess> SessionGuesses => Set<SessionGuess>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AnswerEntity>()
            .HasIndex(a => new { a.QuestionId, a.Rank })
            .IsUnique();

        modelBuilder.Entity<AnswerEntity>()
            .HasIndex(a => new { a.QuestionId, a.NormalizedPlayer })
            .IsUnique();

        modelBuilder.Entity<SessionGuess>()
            .HasIndex(g => new { g.SessionId, g.QuestionId, g.NormalizedPlayer })
            .IsUnique();

        modelBuilder.Entity<SessionGuess>()
            .HasOne(g => g.Session)
            .WithMany(s => s.Guesses)
            .HasForeignKey(g => g.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore;
using CricketTop10Game.Api.Models;

namespace CricketTop10Game.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<QuestionEntity> Questions => Set<QuestionEntity>();
    public DbSet<AnswerEntity> Answers => Set<AnswerEntity>();
    public DbSet<GameSession> GameSessions => Set<GameSession>();
}

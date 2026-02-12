using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CricketTop10Game.Api.Services;

public class DatabaseSeeder
{
    private static readonly (string Player, int Rank)[] DefaultAnswers =
    {
        ("Sachin Tendulkar", 1),
        ("Virat Kohli", 2),
        ("Ricky Ponting", 3),
        ("Jacques Kallis", 4),
        ("Kumar Sangakkara", 5),
        ("Mahela Jayawardene", 6),
        ("Rahul Dravid", 7),
        ("Brian Lara", 8),
        ("AB de Villiers", 9),
        ("MS Dhoni", 10)
    };

    private readonly AppDbContext _db;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(AppDbContext db, ILogger<DatabaseSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public void SeedDefaultQuestionIfEmpty()
    {
        if (_db.Questions.AsNoTracking().Any())
        {
            return;
        }

        var questionId = Guid.NewGuid();
        var question = new QuestionEntity
        {
            Id = questionId,
            Text = "Top 10 ODI run scorers (all time)",
            Answers = DefaultAnswers
                .Select(a => new AnswerEntity
                {
                    Id = Guid.NewGuid(),
                    QuestionId = questionId,
                    Player = a.Player,
                    NormalizedPlayer = Normalize(a.Player),
                    Rank = a.Rank
                })
                .ToList()
        };

        _db.Questions.Add(question);

        var playerPool = DefaultAnswers.Select(a => new Player
        {
            Name = a.Player,
            NormalizedName = Normalize(a.Player)
        });
        _db.Players.AddRange(playerPool);

        _db.SaveChanges();
        _logger.LogWarning("Seeded default question because the Questions table was empty.");
    }

    private static string Normalize(string value) => value.Trim().ToLowerInvariant();
}

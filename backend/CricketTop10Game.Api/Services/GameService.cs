using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Models;

namespace CricketTop10Game.Api.Services;

public class GameService
{
    private readonly AppDbContext _db;

    // ⚠️ MVP state (single-session). We’ll make this per-user later.
    private readonly HashSet<string> _guessed = new();
    private int _lives = 3;

    public GameService(AppDbContext db)
    {
        _db = db;
    }

    // -----------------------------
    // Question
    // -----------------------------
    public QuestionEntity GetQuestion()
    {
        // For now: return the first question.
        // Next step: random / rotation.
        var q = _db.Questions.First();

        return new QuestionEntity
        {
            Id = q.Id,
            Text = q.Text
        };
    }

    // -----------------------------
    // State
    // -----------------------------
    public object GetState()
    {
        return new
        {
            lives = _lives,
            found = _guessed.Count
        };
    }

    // -----------------------------
    // Guess logic (DB-backed)
    // -----------------------------
    public GuessResult Guess(Guid questionId, string guess)
    {
        if (_lives <= 0)
            return new GuessResult { Message = "Game over" };

        var normalizedGuess = Normalize(guess);

        if (_guessed.Contains(normalizedGuess))
            return new GuessResult { Message = "Already guessed" };

        var answer = _db.Answers.FirstOrDefault(a =>
            a.QuestionId == questionId &&
            a.NormalizedPlayer == normalizedGuess
        );

        if (answer != null)
        {
            _guessed.Add(normalizedGuess);

            return new GuessResult
            {
                Correct = true,
                Player = answer.Player,
                Rank = answer.Rank,
                Message = "Correct"
            };
        }

        _lives--;

        return new GuessResult
        {
            Correct = false,
            Message = "Wrong guess"
        };
    }

    // -----------------------------
    // Reset game
    // -----------------------------
    public void Reset()
    {
        _guessed.Clear();
        _lives = 3;
    }

    // -----------------------------
    // Reveal answers (game over)
    // -----------------------------
    public IEnumerable<AnswerEntity> GetAllAnswers(Guid questionId)
    {
        return _db.Answers
            .Where(a => a.QuestionId == questionId)
            .OrderBy(a => a.Rank)
            .Select(a => new AnswerEntity
            {
                Player = a.Player,
                Rank = a.Rank
            })
            .ToList();
    }

    // -----------------------------
    // Helpers
    // -----------------------------
    private static string Normalize(string input)
    {
        return input.Trim().ToLowerInvariant();
    }
}

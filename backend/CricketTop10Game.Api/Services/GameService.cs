using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Models;
using System.Text.Json;

namespace CricketTop10Game.Api.Services;

public class GameService
{
    private readonly AppDbContext _db;

    // ⚠️ MVP state (single-session). We’ll make this per-user later.

    public GameService(AppDbContext db)
    {
        _db = db;
    }

    // -----------------------------
    // Session Management
    // -----------------------------
    private GameSession GetOrCreateSession(Guid sessionId, Guid questionId)
    {
        var session = _db.GameSessions.FirstOrDefault(s => s.SessionId == sessionId);
        
        if (session == null)
        {
            session = new GameSession
            {
                SessionId = sessionId,
                QuestionId = questionId,
                Lives = 3,
                GuessedPlayersJson = "[]",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.GameSessions.Add(session);
            _db.SaveChanges();
        }
        else
        {
            // Update question if different
            if (session.QuestionId != questionId)
            {
                session.QuestionId = questionId;
                session.Lives = 3;
                session.GuessedPlayersJson = "[]";
                session.UpdatedAt = DateTime.UtcNow;
                _db.SaveChanges();
            }
        }
        
        return session;
    }

    private HashSet<string> GetGuessedPlayers(GameSession session)
    {
        if (string.IsNullOrEmpty(session.GuessedPlayersJson) || session.GuessedPlayersJson == "[]")
            return new HashSet<string>();
        
        try
        {
            var players = JsonSerializer.Deserialize<List<string>>(session.GuessedPlayersJson);
            return players != null ? new HashSet<string>(players) : new HashSet<string>();
        }
        catch
        {
            return new HashSet<string>();
        }
    }

    private void SaveGuessedPlayers(GameSession session, HashSet<string> guessed)
    {
        session.GuessedPlayersJson = JsonSerializer.Serialize(guessed.ToList());
        session.UpdatedAt = DateTime.UtcNow;
        _db.SaveChanges();
    }

    // -----------------------------
    // Question
    // -----------------------------
    public QuestionEntity GetQuestion(Guid? sessionId = null)
    {
        var questions = _db.Questions.ToList();
        
        if (questions.Count == 0)
            throw new InvalidOperationException("No questions available in the database");

        // If session exists, try to get a different question than the current one
        Guid? currentQuestionId = null;
        if (sessionId.HasValue)
        {
            var session = _db.GameSessions.FirstOrDefault(s => s.SessionId == sessionId.Value);
            if (session != null)
            {
                currentQuestionId = session.QuestionId;
            }
        }

        // Filter out current question if we have multiple questions
        var availableQuestions = currentQuestionId.HasValue && questions.Count > 1
            ? questions.Where(q => q.Id != currentQuestionId.Value).ToList()
            : questions;

        // Return a random question from available questions
        var random = new Random();
        var q = availableQuestions[random.Next(availableQuestions.Count)];

        return new QuestionEntity
        {
            Id = q.Id,
            Text = q.Text
        };
    }

    // -----------------------------
    // State
    // -----------------------------
    public object GetState(Guid sessionId)
    {
        var session = _db.GameSessions.FirstOrDefault(s => s.SessionId == sessionId);
        
        if (session == null)
        {
            // Return default state for new session
            return new
            {
                lives = 3,
                found = 0,
                correctGuesses = new List<object>()
            };
        }

        var guessed = GetGuessedPlayers(session);
        
        // Get full details of guessed players (player name and rank)
        var correctGuesses = new List<object>();
        if (guessed.Count > 0)
        {
            var guessedAnswers = _db.Answers
                .Where(a => a.QuestionId == session.QuestionId && 
                           guessed.Contains(a.NormalizedPlayer))
                .Select(a => new
                {
                    player = a.Player,
                    rank = a.Rank
                })
                .ToList();
            
            correctGuesses = guessedAnswers.Cast<object>().ToList();
        }
        
        return new
        {
            lives = session.Lives,
            found = guessed.Count,
            correctGuesses = correctGuesses
        };
    }

    // -----------------------------
    // Guess logic (DB-backed)
    // -----------------------------
    public GuessResult Guess(Guid sessionId, Guid questionId, string guess)
    {
        if (string.IsNullOrWhiteSpace(guess))
            throw new ArgumentException("Guess cannot be empty", nameof(guess));

        if (guess.Length > 50)
            throw new ArgumentException("Guess must be 50 characters or less", nameof(guess));

        // Get or create session
        var session = GetOrCreateSession(sessionId, questionId);

        if (session.Lives <= 0)
            return new GuessResult { Message = "Game over" };

        var normalizedGuess = Normalize(guess);
        var guessed = GetGuessedPlayers(session);

        if (guessed.Contains(normalizedGuess))
            return new GuessResult { Message = "Already guessed" };

        // Verify question exists
        var questionExists = _db.Questions.Any(q => q.Id == questionId);
        if (!questionExists)
            throw new ArgumentException("Invalid question ID", nameof(questionId));

        var answer = _db.Answers.FirstOrDefault(a =>
            a.QuestionId == questionId &&
            a.NormalizedPlayer == normalizedGuess
        );

        if (answer != null)
        {
            guessed.Add(normalizedGuess);
            SaveGuessedPlayers(session, guessed);

            return new GuessResult
            {
                Correct = true,
                Player = answer.Player,
                Rank = answer.Rank,
                Message = "Correct"
            };
        }

        session.Lives--;
        session.UpdatedAt = DateTime.UtcNow;
        _db.SaveChanges();

        return new GuessResult
        {
            Correct = false,
            Message = "Wrong guess"
        };
    }

    // -----------------------------
    // Reset game
    // -----------------------------
    public void Reset(Guid sessionId)
    {
        var session = _db.GameSessions.FirstOrDefault(s => s.SessionId == sessionId);
        
        if (session != null)
        {
            session.Lives = 3;
            session.GuessedPlayersJson = "[]";
            session.UpdatedAt = DateTime.UtcNow;
            _db.SaveChanges();
        }
    }

    // -----------------------------
    // Reveal answers (game over)
    // -----------------------------
    public IEnumerable<AnswerEntity> GetAllAnswers(Guid questionId)
    {
        if (questionId == Guid.Empty)
            throw new ArgumentException("Valid question ID is required", nameof(questionId));

        // Verify question exists
        var questionExists = _db.Questions.Any(q => q.Id == questionId);
        if (!questionExists)
            throw new ArgumentException("Invalid question ID", nameof(questionId));

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

using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Dtos;
using CricketTop10Game.Api.Models;
using CricketTop10Game.Api.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CricketTop10Game.Api.Services;

public class GameService
{
    private readonly AppDbContext _db;
    private readonly GameOptions _gameOptions;

    public GameService(AppDbContext db, IOptions<GameOptions> gameOptions)
    {
        _db = db;
        _gameOptions = gameOptions.Value;
    }

    public async Task<QuestionEntity> GetOrCreateCurrentQuestionAsync(
        Guid sessionId,
        Guid? preferredQuestionId = null,
        CancellationToken cancellationToken = default)
    {
        if (preferredQuestionId.HasValue && preferredQuestionId.Value != Guid.Empty)
        {
            var selectedQuestion = await _db.Questions.AsNoTracking()
                .Where(q => q.Id == preferredQuestionId.Value)
                .Select(q => new QuestionEntity { Id = q.Id, Text = q.Text })
                .FirstOrDefaultAsync(cancellationToken);

            if (selectedQuestion is null)
            {
                throw new ArgumentException("Invalid question ID", nameof(preferredQuestionId));
            }

            await GetOrCreateSessionAsync(sessionId, selectedQuestion.Id, cancellationToken);
            return selectedQuestion;
        }

        var session = await _db.GameSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.SessionId == sessionId, cancellationToken);

        if (session is not null)
        {
            var existingQuestion = await _db.Questions.AsNoTracking()
                .Where(q => q.Id == session.QuestionId)
                .Select(q => new QuestionEntity { Id = q.Id, Text = q.Text })
                .FirstOrDefaultAsync(cancellationToken);

            if (existingQuestion is not null)
            {
                return existingQuestion;
            }
        }

        var question = await GetRandomQuestionAsync(cancellationToken);
        await GetOrCreateSessionAsync(sessionId, question.Id, cancellationToken);
        return question;
    }

    public async Task<List<QuestionEntity>> GetQuestionsAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Questions.AsNoTracking()
            .OrderBy(q => q.Text)
            .Select(q => new QuestionEntity
            {
                Id = q.Id,
                Text = q.Text
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<QuestionEntity> GetRandomQuestionAsync(CancellationToken cancellationToken = default)
    {
        var questionIds = await _db.Questions
            .AsNoTracking()
            .Select(q => q.Id)
            .ToListAsync(cancellationToken);

        if (questionIds.Count == 0)
        {
            throw new InvalidOperationException("No questions available in the database");
        }

        var randomId = questionIds[Random.Shared.Next(questionIds.Count)];
        var question = await _db.Questions.AsNoTracking()
            .Where(q => q.Id == randomId)
            .Select(q => new QuestionEntity { Id = q.Id, Text = q.Text })
            .FirstAsync(cancellationToken);

        return question;
    }

    public async Task<GameStateDto> GetStateAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _db.GameSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.SessionId == sessionId, cancellationToken);

        if (session is null)
        {
            return new GameStateDto
            {
                Lives = _gameOptions.InitialLives,
                Found = 0
            };
        }

        var correctGuesses = await (
            from guess in _db.SessionGuesses.AsNoTracking()
            join answer in _db.Answers.AsNoTracking()
                on new { guess.QuestionId, guess.NormalizedPlayer } equals new { answer.QuestionId, answer.NormalizedPlayer }
            where guess.SessionId == session.SessionId && guess.QuestionId == session.QuestionId
            orderby answer.Rank
            select new AnswerDto
            {
                Player = answer.Player,
                Rank = answer.Rank
            }).ToListAsync(cancellationToken);

        return new GameStateDto
        {
            Lives = session.Lives,
            Found = correctGuesses.Count,
            CorrectGuesses = correctGuesses
        };
    }

    public async Task<GuessResponseDto> GuessAsync(Guid sessionId, Guid questionId, string guess, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(guess))
        {
            throw new ArgumentException("Guess cannot be empty", nameof(guess));
        }

        if (guess.Length > _gameOptions.MaxGuessLength)
        {
            throw new ArgumentException($"Guess must be {_gameOptions.MaxGuessLength} characters or less", nameof(guess));
        }

        await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
        var session = await GetOrCreateSessionAsync(sessionId, questionId, cancellationToken);

        if (session.Lives <= 0)
        {
            var gameOverState = await GetStateAsync(sessionId, cancellationToken);
            return new GuessResponseDto
            {
                Result = new GuessResult { Message = "Game over" },
                State = gameOverState,
                GameStatus = "lost"
            };
        }

        var normalizedGuess = Normalize(guess);

        var alreadyGuessed = await _db.SessionGuesses.AnyAsync(
            g => g.SessionId == sessionId && g.QuestionId == questionId && g.NormalizedPlayer == normalizedGuess,
            cancellationToken);

        if (alreadyGuessed)
        {
            var state = await GetStateAsync(sessionId, cancellationToken);
            return new GuessResponseDto
            {
                Result = new GuessResult { Message = "Already guessed" },
                State = state,
                GameStatus = state.Found >= _gameOptions.MaxAnswersPerQuestion ? "won" : "active"
            };
        }

        var answer = await _db.Answers.AsNoTracking().FirstOrDefaultAsync(
            a => a.QuestionId == questionId && a.NormalizedPlayer == normalizedGuess,
            cancellationToken);

        GuessResult result;
        if (answer is not null)
        {
            _db.SessionGuesses.Add(new SessionGuess
            {
                Id = Guid.NewGuid(),
                SessionId = session.SessionId,
                QuestionId = questionId,
                NormalizedPlayer = normalizedGuess,
                CreatedAt = DateTime.UtcNow
            });

            result = new GuessResult
            {
                Correct = true,
                Player = answer.Player,
                Rank = answer.Rank,
                Message = "Correct"
            };
        }
        else
        {
            session.Lives--;
            session.UpdatedAt = DateTime.UtcNow;
            result = new GuessResult
            {
                Correct = false,
                Message = "Wrong guess"
            };
        }

        await _db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        var updatedState = await GetStateAsync(sessionId, cancellationToken);
        var status = updatedState.Found >= _gameOptions.MaxAnswersPerQuestion ? "won"
            : updatedState.Lives <= 0 ? "lost"
            : "active";

        return new GuessResponseDto
        {
            Result = result,
            State = updatedState,
            GameStatus = status
        };
    }

    public async Task ResetAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _db.GameSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId, cancellationToken);
        if (session is null)
        {
            return;
        }

        session.Lives = _gameOptions.InitialLives;
        session.GuessedPlayersJson = "[]";
        session.UpdatedAt = DateTime.UtcNow;

        var guesses = _db.SessionGuesses.Where(g => g.SessionId == sessionId);
        _db.SessionGuesses.RemoveRange(guesses);

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<AnswerDto>> GetAllAnswersAsync(Guid questionId, CancellationToken cancellationToken = default)
    {
        if (questionId == Guid.Empty)
        {
            throw new ArgumentException("Valid question ID is required", nameof(questionId));
        }

        var questionExists = await _db.Questions.AnyAsync(q => q.Id == questionId, cancellationToken);
        if (!questionExists)
        {
            throw new ArgumentException("Invalid question ID", nameof(questionId));
        }

        return await _db.Answers.AsNoTracking()
            .Where(a => a.QuestionId == questionId)
            .OrderBy(a => a.Rank)
            .Select(a => new AnswerDto
            {
                Player = a.Player,
                Rank = a.Rank
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<GameSession> GetOrCreateSessionAsync(Guid sessionId, Guid questionId, CancellationToken cancellationToken)
    {
        var session = await _db.GameSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId, cancellationToken);

        if (session is null)
        {
            session = new GameSession
            {
                SessionId = sessionId,
                QuestionId = questionId,
                Lives = _gameOptions.InitialLives,
                GuessedPlayersJson = "[]",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.GameSessions.Add(session);
            await _db.SaveChangesAsync(cancellationToken);
            return session;
        }

        if (session.QuestionId != questionId)
        {
            session.QuestionId = questionId;
            session.Lives = _gameOptions.InitialLives;
            session.GuessedPlayersJson = "[]";
            session.UpdatedAt = DateTime.UtcNow;
            var guesses = _db.SessionGuesses.Where(g => g.SessionId == sessionId);
            _db.SessionGuesses.RemoveRange(guesses);
            await _db.SaveChangesAsync(cancellationToken);
        }

        return session;
    }

    private static string Normalize(string input) => input.Trim().ToLowerInvariant();
}

using Microsoft.AspNetCore.Mvc;
using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Dtos;
using CricketTop10Game.Api.Models;
using CricketTop10Game.Api.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using CricketTop10Game.Api.Services;

namespace CricketTop10Game.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly GameOptions _gameOptions;
    private readonly GameService _gameService;

    public AdminController(AppDbContext db, IOptions<GameOptions> gameOptions, GameService gameService)
    {
        _db = db;
        _gameOptions = gameOptions.Value;
        _gameService = gameService;
    }

    [HttpPost("questions")]
    public async Task<IActionResult> CreateQuestion([FromBody] CreateQuestionDto dto, CancellationToken cancellationToken)
    {
        if (dto == null)
        {
            return Problem(detail: "Request body is required", statusCode: StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(dto.Question))
        {
            return Problem(detail: "Question text is required", statusCode: StatusCodes.Status400BadRequest);
        }

        if (dto.Answers == null || dto.Answers.Count == 0)
        {
            return Problem(detail: "At least one answer is required", statusCode: StatusCodes.Status400BadRequest);
        }

        if (dto.Answers.Count > _gameOptions.MaxAnswersPerQuestion)
        {
            return Problem(detail: $"Maximum {_gameOptions.MaxAnswersPerQuestion} answers allowed", statusCode: StatusCodes.Status400BadRequest);
        }

        var ranks = dto.Answers.Select(a => a.Rank).ToList();
        if (ranks.Any(r => r < 1 || r > _gameOptions.MaxAnswersPerQuestion))
        {
            return Problem(detail: $"Ranks must be between 1 and {_gameOptions.MaxAnswersPerQuestion}", statusCode: StatusCodes.Status400BadRequest);
        }

        if (ranks.Distinct().Count() != ranks.Count)
        {
            return Problem(detail: "Ranks must be unique", statusCode: StatusCodes.Status400BadRequest);
        }

        if (dto.Answers.Any(a => string.IsNullOrWhiteSpace(a.Player)))
        {
            return Problem(detail: "Player name cannot be empty", statusCode: StatusCodes.Status400BadRequest);
        }

        var question = new QuestionEntity
        {
            Id = Guid.NewGuid(),
            Text = dto.Question.Trim(),
            Answers = dto.Answers.Select(a => new AnswerEntity
            {
                Id = Guid.NewGuid(),
                Player = a.Player.Trim(),
                NormalizedPlayer = a.Player.Trim().ToLowerInvariant(),
                Rank = a.Rank
            }).ToList()
        };

        _db.Questions.Add(question);
        await _db.SaveChangesAsync(cancellationToken);
        await _gameService.UpsertPlayersAsync(dto.Answers.Select(a => a.Player), cancellationToken);

        return Ok(new { questionId = question.Id });
    }

    [HttpPost("players")]
    public async Task<IActionResult> AddPlayers([FromBody] CreatePlayersDto dto, CancellationToken cancellationToken)
    {
        if (dto == null || dto.Players == null || dto.Players.Count == 0)
        {
            return Problem(detail: "At least one player is required", statusCode: StatusCodes.Status400BadRequest);
        }

        var added = await _gameService.UpsertPlayersAsync(dto.Players, cancellationToken);
        return Ok(new { added });
    }

    [HttpGet("questions/{questionId:guid}")]
    public async Task<IActionResult> GetQuestion(Guid questionId, CancellationToken cancellationToken)
    {
        var question = await _db.Questions.AsNoTracking()
            .Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == questionId, cancellationToken);

        if (question is null)
        {
            return NotFound();
        }

        return Ok(question);
    }
}

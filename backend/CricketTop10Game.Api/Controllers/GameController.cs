using Microsoft.AspNetCore.Mvc;
using CricketTop10Game.Api.Services;
using CricketTop10Game.Api.Dtos;
using Microsoft.AspNetCore.RateLimiting;

namespace CricketTop10Game.Api.Controllers;

[ApiController]
[Route("api/v1")]
 [EnableRateLimiting("gameplay")]
public class GameController : ControllerBase
{
    private readonly GameService _game;

    public GameController(GameService game)
    {
        _game = game;
    }

    private Guid GetOrCreateSessionId()
    {
        if (Request.Headers.TryGetValue("X-Session-Id", out var sessionIdHeader) &&
            Guid.TryParse(sessionIdHeader.ToString(), out var sessionId))
        {
            return sessionId;
        }
        return Guid.NewGuid();
    }

    [HttpGet("questions/current")]
    public async Task<IActionResult> GetCurrentQuestion(CancellationToken cancellationToken)
    {
        var sessionId = GetOrCreateSessionId();
        var question = await _game.GetOrCreateCurrentQuestionAsync(sessionId, cancellationToken);
        Response.Headers["X-Session-Id"] = sessionId.ToString();
        return Ok(question);
    }

    [HttpGet("state")]
    public async Task<IActionResult> GetState(CancellationToken cancellationToken)
    {
        var sessionId = GetOrCreateSessionId();
        var state = await _game.GetStateAsync(sessionId, cancellationToken);
        Response.Headers["X-Session-Id"] = sessionId.ToString();
        return Ok(state);
    }

    [HttpPost("guess")]
    public async Task<IActionResult> Guess([FromBody] GuessRequestDto request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return Problem(detail: "Request body is required", statusCode: StatusCodes.Status400BadRequest);
        }
        if (string.IsNullOrWhiteSpace(request.Guess))
        {
            return Problem(detail: "Guess is required", statusCode: StatusCodes.Status400BadRequest);
        }
        if (request.QuestionId == Guid.Empty)
        {
            return Problem(detail: "Valid question ID is required", statusCode: StatusCodes.Status400BadRequest);
        }

        var sessionId = GetOrCreateSessionId();
        var response = await _game.GuessAsync(sessionId, request.QuestionId, request.Guess, cancellationToken);
        Response.Headers["X-Session-Id"] = sessionId.ToString();
        return Ok(response);
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset(CancellationToken cancellationToken)
    {
        var sessionId = GetOrCreateSessionId();
        await _game.ResetAsync(sessionId, cancellationToken);
        Response.Headers["X-Session-Id"] = sessionId.ToString();
        return Ok(new { message = "Game reset successfully" });
    }

    [HttpGet("answers")]
    public async Task<IActionResult> Answers([FromQuery] Guid questionId, CancellationToken cancellationToken)
    {
        if (questionId == Guid.Empty)
        {
            return Problem(detail: "Valid question ID is required", statusCode: StatusCodes.Status400BadRequest);
        }

        var answers = await _game.GetAllAnswersAsync(questionId, cancellationToken);
        return Ok(answers);
    }
}

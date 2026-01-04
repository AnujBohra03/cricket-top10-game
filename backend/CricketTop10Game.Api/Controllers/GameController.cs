using Microsoft.AspNetCore.Mvc;
using CricketTop10Game.Api.Services;
using CricketTop10Game.Api.Dtos;

namespace CricketTop10Game.Api.Controllers;

[ApiController]
[Route("")]
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

    [HttpGet("question")]
    public IActionResult GetQuestion()
    {
        try
        {
            var sessionId = GetOrCreateSessionId();
            var question = _game.GetQuestion(sessionId);
            Response.Headers["X-Session-Id"] = sessionId.ToString();
            return Ok(question);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { error = "No questions available" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "An error occurred while fetching the question" });
        }
    }

    [HttpGet("state")]
    public IActionResult GetState()
    {
        try
        {
            var sessionId = GetOrCreateSessionId();
            var state = _game.GetState(sessionId);
            Response.Headers["X-Session-Id"] = sessionId.ToString();
            return Ok(state);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "An error occurred while fetching game state" });
        }
    }

    [HttpPost("guess")]
    public IActionResult Guess([FromBody] GuessRequestDto request)
    {
        try
        {
            if (request == null)
                return BadRequest(new { error = "Request body is required" });

            if (string.IsNullOrWhiteSpace(request.Guess))
                return BadRequest(new { error = "Guess is required" });

            if (request.QuestionId == Guid.Empty)
                return BadRequest(new { error = "Valid question ID is required" });

            var sessionId = GetOrCreateSessionId();
            var result = _game.Guess(sessionId, request.QuestionId, request.Guess);
            Response.Headers["X-Session-Id"] = sessionId.ToString();
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "An error occurred while processing your guess" });
        }
    }

    [HttpPost("reset")]
    public IActionResult Reset()
    {
        try
        {
            var sessionId = GetOrCreateSessionId();
            _game.Reset(sessionId);
            Response.Headers["X-Session-Id"] = sessionId.ToString();
            return Ok(new { message = "Game reset successfully" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "An error occurred while resetting the game" });
        }
    }

    [HttpGet("answers")]
    public IActionResult Answers([FromQuery] Guid questionId)
    {
        try
        {
            if (questionId == Guid.Empty)
                return BadRequest(new { error = "Valid question ID is required" });

            var answers = _game.GetAllAnswers(questionId);
            return Ok(answers);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "An error occurred while fetching answers" });
        }
    }
}
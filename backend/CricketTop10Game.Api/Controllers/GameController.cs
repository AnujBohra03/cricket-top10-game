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

    [HttpGet("question")]
    public IActionResult GetQuestion() =>
        Ok(_game.GetQuestion());

    [HttpGet("state")]
    public IActionResult GetState() =>
        Ok(_game.GetState());

    [HttpPost("guess")]
    public IActionResult Guess([FromBody] GuessRequestDto request)
    {
        return Ok(_game.Guess(request.QuestionId, request.Guess));
    }


    [HttpPost("reset")]
    public IActionResult Reset()
    {
        _game.Reset();
        return Ok();
    }

    [HttpGet("answers")]
    public IActionResult Answers([FromQuery] Guid questionId)
    {
        return Ok(_game.GetAllAnswers(questionId));
    }
}
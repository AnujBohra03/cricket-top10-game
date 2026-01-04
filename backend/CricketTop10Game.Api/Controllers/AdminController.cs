using Microsoft.AspNetCore.Mvc;
using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Dtos;
using CricketTop10Game.Api.Models;

namespace CricketTop10Game.Api.Controllers;

[ApiController]
[Route("admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("questions")]
    public IActionResult CreateQuestion(CreateQuestionDto dto)
    {
        if (dto.Answers.Count == 0)
            return BadRequest("Answers required");

        var question = new QuestionEntity
        {
            Id = Guid.NewGuid(),
            Text = dto.Question,
            Answers = dto.Answers.Select(a => new AnswerEntity
            {
                Id = Guid.NewGuid(),
                Player = a.Player.Trim(),
                NormalizedPlayer = a.Player.Trim().ToLowerInvariant(),
                Rank = a.Rank
            }).ToList()
        };

        _db.Questions.Add(question);
        _db.SaveChanges();

        return Ok(new { questionId = question.Id });
    }
}

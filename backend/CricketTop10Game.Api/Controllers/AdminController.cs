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
        try
        {
            if (dto == null)
                return BadRequest(new { error = "Request body is required" });

            if (string.IsNullOrWhiteSpace(dto.Question))
                return BadRequest(new { error = "Question text is required" });

            if (dto.Answers == null || dto.Answers.Count == 0)
                return BadRequest(new { error = "At least one answer is required" });

            if (dto.Answers.Count > 10)
                return BadRequest(new { error = "Maximum 10 answers allowed" });

            // Validate ranks are unique and within 1-10
            var ranks = dto.Answers.Select(a => a.Rank).ToList();
            if (ranks.Any(r => r < 1 || r > 10))
                return BadRequest(new { error = "Ranks must be between 1 and 10" });

            if (ranks.Distinct().Count() != ranks.Count)
                return BadRequest(new { error = "Ranks must be unique" });

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
            _db.SaveChanges();

            return Ok(new { questionId = question.Id });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "An error occurred while creating the question" });
        }
    }
}

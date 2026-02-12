using System.ComponentModel.DataAnnotations;

namespace CricketTop10Game.Api.Models;

public class SessionGuess
{
    [Key]
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid QuestionId { get; set; }
    public string NormalizedPlayer { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public GameSession? Session { get; set; }
}

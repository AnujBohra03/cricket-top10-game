using System.ComponentModel.DataAnnotations;

namespace CricketTop10Game.Api.Models;

public class GameSession
{
    [Key]
    public Guid SessionId { get; set; }
    public Guid QuestionId { get; set; }
    public int Lives { get; set; }
    public string GuessedPlayersJson { get; set; } = "[]"; // JSON array of normalized player names
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

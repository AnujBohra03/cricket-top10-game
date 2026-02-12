using CricketTop10Game.Api.Models;

namespace CricketTop10Game.Api.Dtos;

public class GuessResponseDto
{
    public GuessResult Result { get; set; } = new();
    public GameStateDto State { get; set; } = new();
    public string GameStatus { get; set; } = "active";
}

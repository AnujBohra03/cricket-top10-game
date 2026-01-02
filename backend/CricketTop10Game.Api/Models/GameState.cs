namespace CricketTop10Game.Api.Models;

public class GameState
{
    public int Lives { get; set; } = 3;
    public List<int> CorrectGuesses { get; set; } = new();
}

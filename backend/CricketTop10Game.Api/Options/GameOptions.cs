namespace CricketTop10Game.Api.Options;

public class GameOptions
{
    public const string SectionName = "Game";
    public int InitialLives { get; set; } = 3;
    public int MaxAnswersPerQuestion { get; set; } = 10;
    public int MaxGuessLength { get; set; } = 50;
}

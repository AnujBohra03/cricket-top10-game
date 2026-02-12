namespace CricketTop10Game.Api.Dtos;

public class GameStateDto
{
    public int Lives { get; set; }
    public int Found { get; set; }
    public List<AnswerDto> CorrectGuesses { get; set; } = new();
}

public class AnswerDto
{
    public string Player { get; set; } = string.Empty;
    public int Rank { get; set; }
}

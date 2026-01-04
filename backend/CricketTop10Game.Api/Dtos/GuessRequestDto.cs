namespace CricketTop10Game.Api.Dtos;

public class GuessRequestDto
{
    public Guid QuestionId { get; set; }
    public string Guess { get; set; } = string.Empty;
}

namespace CricketTop10Game.Api.Models;

public class AnswerEntity
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }

    public string Player { get; set; } = string.Empty;
    public string NormalizedPlayer { get; set; } = string.Empty;
    public int Rank { get; set; }

    public QuestionEntity? Question { get; set; }
}

namespace CricketTop10Game.Api.Models;

public class QuestionEntity
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public ICollection<AnswerEntity> Answers { get; set; } = new List<AnswerEntity>();
}

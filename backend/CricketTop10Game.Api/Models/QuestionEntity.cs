namespace CricketTop10Game.Api.Models;

public class QuestionEntity
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public ICollection<AnswerEntity> Answers { get; set; } = new List<AnswerEntity>();
}

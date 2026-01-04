namespace CricketTop10Game.Api.Dtos;

public class CreateQuestionDto
{
    public string Question { get; set; } = string.Empty;
    public List<CreateAnswerDto> Answers { get; set; } = new();
}

public class CreateAnswerDto
{
    public string Player { get; set; } = string.Empty;
    public int Rank { get; set; }
}

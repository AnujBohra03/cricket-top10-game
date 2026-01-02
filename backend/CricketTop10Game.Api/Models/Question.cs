namespace CricketTop10Game.Api.Models;

public class Question
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;

    // PlayerId -> Rank (1–10)
    public Dictionary<int, int> Top10 { get; set; } = new();
}

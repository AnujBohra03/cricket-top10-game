public class GuessResult
{
    public bool Correct { get; set; }
    public string? Player { get; set; }
    public int? Rank { get; set; }
    public string Message { get; set; } = string.Empty;
}

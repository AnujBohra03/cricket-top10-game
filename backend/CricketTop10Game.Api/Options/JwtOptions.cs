namespace CricketTop10Game.Api.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "CricketTop10Game";
    public string Audience { get; set; } = "CricketTop10GameClients";
    public string SecretKey { get; set; } = "replace-this-with-a-long-random-secret-key";
    public int ExpiryMinutes { get; set; } = 60;
}

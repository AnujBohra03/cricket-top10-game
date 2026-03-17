using CricketTop10Game.Api.Options;
using Microsoft.Extensions.Options;

namespace CricketTop10Game.Api.Startup;

public static class StartupValidator
{
    private static readonly HashSet<string> DefaultPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "change-me", "changeme", "password", "admin", "secret", "1234", "12345", "123456"
    };

    private static readonly HashSet<string> DefaultJwtSecrets = new(StringComparer.OrdinalIgnoreCase)
    {
        "replace-this-in-env-with-a-long-random-secret-key",
        "replace-this-with-a-long-random-secret-key"
    };

    public static void ValidateProductionSecrets(WebApplication app)
    {
        if (!app.Environment.IsProduction())
            return;

        var errors = new List<string>();

        var adminOpts = app.Services.GetRequiredService<IOptions<AdminAuthOptions>>().Value;
        var jwtOpts = app.Services.GetRequiredService<IOptions<JwtOptions>>().Value;

        if (string.IsNullOrWhiteSpace(adminOpts.Password) || DefaultPasswords.Contains(adminOpts.Password))
            errors.Add("AdminAuth:Password is set to a default or insecure value. Set a strong password via environment variable or secrets.");

        if (string.IsNullOrWhiteSpace(adminOpts.Username) || adminOpts.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
            errors.Add("AdminAuth:Username is 'admin'. Use a non-default username in production.");

        if (string.IsNullOrWhiteSpace(jwtOpts.SecretKey) || DefaultJwtSecrets.Contains(jwtOpts.SecretKey))
            errors.Add("Jwt:SecretKey is set to a placeholder value. Set a cryptographically strong secret (32+ chars) via environment variable or secrets.");
        else if (jwtOpts.SecretKey.Length < 32)
            errors.Add("Jwt:SecretKey is too short. Use at least 32 characters for HMAC-SHA256.");

        if (errors.Count > 0)
        {
            var message = "Application startup blocked: insecure default credentials detected in Production.\n" +
                          string.Join("\n", errors.Select(e => $"  - {e}"));
            throw new InvalidOperationException(message);
        }
    }
}

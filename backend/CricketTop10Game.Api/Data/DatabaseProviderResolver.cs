namespace CricketTop10Game.Api.Data;

public static class DatabaseProviderResolver
{
    public const string Sqlite = "Sqlite";
    public const string Postgres = "Postgres";

    public static string Resolve(string? configuredProvider, string? connectionString)
    {
        if (!string.IsNullOrWhiteSpace(configuredProvider))
        {
            return configuredProvider.Trim();
        }

        if (!string.IsNullOrWhiteSpace(connectionString) &&
            (connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase) ||
             connectionString.Contains("postgres://", StringComparison.OrdinalIgnoreCase) ||
             connectionString.Contains("postgresql://", StringComparison.OrdinalIgnoreCase)))
        {
            return Postgres;
        }

        return Sqlite;
    }
}

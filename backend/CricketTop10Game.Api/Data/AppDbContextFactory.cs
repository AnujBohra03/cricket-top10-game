using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace CricketTop10Game.Api.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config.GetConnectionString("DefaultConnection") ?? "Data Source=cricket.db";
        var configuredProvider = config.GetValue<string>("Database:Provider");
        var provider = DatabaseProviderResolver.Resolve(configuredProvider, connectionString);

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        if (provider.Equals(DatabaseProviderResolver.Postgres, StringComparison.OrdinalIgnoreCase))
        {
            optionsBuilder.UseNpgsql(connectionString);
        }
        else
        {
            optionsBuilder.UseSqlite(connectionString);
        }

        return new AppDbContext(optionsBuilder.Options);
    }
}

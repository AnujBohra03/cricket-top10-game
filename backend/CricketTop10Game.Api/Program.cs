using System.Text;
using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Middleware;
using CricketTop10Game.Api.Options;
using CricketTop10Game.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<GameOptions>(builder.Configuration.GetSection(GameOptions.SectionName));
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<AdminAuthOptions>(builder.Configuration.GetSection(AdminAuthOptions.SectionName));

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<GameService>();
builder.Services.AddScoped<AdminAuthService>();
builder.Services.AddMemoryCache();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("gameplay", limiter =>
    {
        limiter.Window = TimeSpan.FromSeconds(30);
        limiter.PermitLimit = 60;
        limiter.QueueLimit = 0;
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=cricket.db";
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://anujbohra03.github.io")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseStartup");
    var runMigrations = builder.Configuration.GetValue("Database:RunMigrationsOnStartup", true);
    var allowDevFallbackEnsureCreated = builder.Configuration.GetValue("Database:AllowDevEnsureCreatedFallback", true);

    if (runMigrations)
    {
        try
        {
            logger.LogInformation("Applying database migrations on startup.");
            db.Database.Migrate();
            logger.LogInformation("Database migrations completed.");
        }
        catch (Exception ex) when (app.Environment.IsDevelopment() && allowDevFallbackEnsureCreated)
        {
            logger.LogWarning(ex, "Migration failed in Development. Falling back to EnsureCreated().");
            db.Database.EnsureCreated();
            logger.LogInformation("EnsureCreated fallback completed.");
        }
    }
    else
    {
        logger.LogWarning("Database migrations are disabled by configuration.");
    }
}

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () =>
    Results.Ok(new { status = "OK", service = "Cricket Top 10 Game API", utc = DateTime.UtcNow }));

app.Run();

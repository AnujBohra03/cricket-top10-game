using CricketTop10Game.Api.Data;
using CricketTop10Game.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddControllers();
builder.Services.AddScoped<GameService>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=cricket.db"));


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://anujbohra03.github.io"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors("AllowFrontend");
app.MapControllers();

app.MapGet("/health", () =>
    Results.Ok(new { status = "OK", service = "Cricket Top 10 Game API" })
);

app.Run();

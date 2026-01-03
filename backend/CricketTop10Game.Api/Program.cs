using CricketTop10Game.Api.Data;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:5174", "http://localhost:5173", "https://anujbohra03.github.io")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


var app = builder.Build();

app.UseCors("FrontendPolicy");

app.UseHttpsRedirection();

// 🔹 Health check endpoint
app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "OK",
        service = "Cricket Top 10 Game API"
    });
});

// 🔹 Get current question
app.MapGet("/question", () =>
{
    return Results.Ok(new
    {
        GameData.Question.Id,
        GameData.Question.Text
    });
});

// 🔹 Get current game state
app.MapGet("/state", () =>
{
    return Results.Ok(new
    {
        lives = GameData.GameState.Lives,
        found = GameData.GameState.CorrectGuesses.Count,
        total = GameData.Question.Top10.Count
    });
});



// 🔹 Make a guess
app.MapPost("/guess", (string playerName) =>
{
    // Find player
    var player = GameData.Players
        .FirstOrDefault(p =>
            p.Name.Equals(playerName, StringComparison.OrdinalIgnoreCase));

    // Player not found
    if (player == null)
    {
        GameData.GameState.Lives--;

        return Results.BadRequest(new
        {
            Message = "Player not found",
            Lives = GameData.GameState.Lives
        });
    }

    // Duplicate correct guess
    if (GameData.GameState.CorrectGuesses.Contains(player.Id))
    {
        return Results.Ok(new
        {
            Message = "Already guessed"
        });
    }

    // Correct guess (Top 10)
    if (GameData.Question.Top10.TryGetValue(player.Id, out int rank))
    {
        GameData.GameState.CorrectGuesses.Add(player.Id);

        return Results.Ok(new
        {
            Correct = true,
            Player = player.Name,
            Rank = rank
        });
    }

    // Wrong guess (not in Top 10)
    GameData.GameState.Lives--;

    return Results.Ok(new
    {
        Correct = false,
        Player = player.Name,
        Lives = GameData.GameState.Lives
    });
});

// 🔹 Reset game
app.MapPost("/reset", () =>
{
    GameData.GameState.Lives = 3;
    GameData.GameState.CorrectGuesses.Clear();

    return Results.Ok(new
    {
        Message = "Game reset successfully",
        Lives = GameData.GameState.Lives
    });
});

// 🔹 Reveal all answers (Top 10)
app.MapGet("/answers", () =>
{
    var answers = GameData.Question.Top10
        .Select(x => new
        {
            Player = GameData.Players.First(p => p.Id == x.Key).Name,
            Rank = x.Value
        })
        .OrderBy(x => x.Rank)
        .ToList();

    return Results.Ok(answers);
});


app.Run();

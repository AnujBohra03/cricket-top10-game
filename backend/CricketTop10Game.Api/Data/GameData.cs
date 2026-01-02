using CricketTop10Game.Api.Models;

namespace CricketTop10Game.Api.Data;

public static class GameData
{
    public static List<Player> Players = new()
    {
        new Player { Id = 1, Name = "Virat Kohli" },
        new Player { Id = 2, Name = "Rohit Sharma" },
        new Player { Id = 3, Name = "Shikhar Dhawan" },
        new Player { Id = 4, Name = "Suresh Raina" },
        new Player { Id = 5, Name = "David Warner" },
        new Player { Id = 6, Name = "AB de Villiers" },
        new Player { Id = 7, Name = "MS Dhoni" },
        new Player { Id = 8, Name = "KL Rahul" },
        new Player { Id = 9, Name = "Chris Gayle" },
        new Player { Id = 10, Name = "Andre Russell" }
    };

    public static Question Question = new()
    {
        Id = 1,
        Text = "Top 10 players with most runs in IPL",
        Top10 = new Dictionary<int, int>
        {
            { 1, 1 },
            { 2, 2 },
            { 5, 3 },
            { 4, 4 },
            { 3, 5 },
            { 7, 6 },
            { 6, 7 },
            { 8, 8 },
            { 9, 9 },
            { 10, 10 }
        }
    };
    public static GameState GameState = new();

}

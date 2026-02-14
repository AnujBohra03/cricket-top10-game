using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CricketTop10Game.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGameSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isPostgres = ActiveProvider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);
            var guidType = isPostgres ? "uuid" : "TEXT";
            var intType = "INTEGER";
            var stringType = "TEXT";
            var dateType = isPostgres ? "timestamp with time zone" : "TEXT";

            migrationBuilder.CreateTable(
                name: "GameSessions",
                columns: table => new
                {
                    SessionId = table.Column<Guid>(type: guidType, nullable: false),
                    QuestionId = table.Column<Guid>(type: guidType, nullable: false),
                    Lives = table.Column<int>(type: intType, nullable: false),
                    GuessedPlayersJson = table.Column<string>(type: stringType, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameSessions", x => x.SessionId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameSessions");
        }
    }
}

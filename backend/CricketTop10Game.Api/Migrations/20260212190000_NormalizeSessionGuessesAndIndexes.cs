using System;
using CricketTop10Game.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CricketTop10Game.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260212190000_NormalizeSessionGuessesAndIndexes")]
    public partial class NormalizeSessionGuessesAndIndexes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isPostgres = ActiveProvider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);
            var guidType = isPostgres ? "uuid" : "TEXT";
            var stringType = "TEXT";
            var dateType = isPostgres ? "timestamp with time zone" : "TEXT";

            if (!ActiveProvider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                migrationBuilder.DropColumn(
                    name: "GuessedPlayersJson",
                    table: "GameSessions");
            }

            migrationBuilder.CreateTable(
                name: "SessionGuesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    SessionId = table.Column<Guid>(type: guidType, nullable: false),
                    QuestionId = table.Column<Guid>(type: guidType, nullable: false),
                    NormalizedPlayer = table.Column<string>(type: stringType, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionGuesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionGuesses_GameSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "GameSessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QuestionId_NormalizedPlayer",
                table: "Answers",
                columns: new[] { "QuestionId", "NormalizedPlayer" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QuestionId_Rank",
                table: "Answers",
                columns: new[] { "QuestionId", "Rank" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionGuesses_SessionId_QuestionId_NormalizedPlayer",
                table: "SessionGuesses",
                columns: new[] { "SessionId", "QuestionId", "NormalizedPlayer" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var stringType = "TEXT";

            migrationBuilder.DropTable(
                name: "SessionGuesses");

            migrationBuilder.DropIndex(
                name: "IX_Answers_QuestionId_NormalizedPlayer",
                table: "Answers");

            migrationBuilder.DropIndex(
                name: "IX_Answers_QuestionId_Rank",
                table: "Answers");

            if (!ActiveProvider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                migrationBuilder.AddColumn<string>(
                    name: "GuessedPlayersJson",
                    table: "GameSessions",
                    type: stringType,
                    nullable: false,
                    defaultValue: "[]");
            }
        }
    }
}

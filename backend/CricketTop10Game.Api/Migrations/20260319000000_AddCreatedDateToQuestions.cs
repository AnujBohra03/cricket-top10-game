using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CricketTop10Game.Api.Migrations
{
    public partial class AddCreatedDateToQuestions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isPostgres = ActiveProvider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);
            var dateType = isPostgres ? "timestamp with time zone" : "TEXT";
            var defaultSql = isPostgres ? "now()" : "datetime('now')";

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "Questions",
                type: dateType,
                nullable: false,
                defaultValueSql: defaultSql);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "Questions");
        }
    }
}

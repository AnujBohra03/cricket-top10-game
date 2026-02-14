using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CricketTop10Game.Api.Migrations
{
    public partial class FixPostgresColumnTypes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (!ActiveProvider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            migrationBuilder.Sql("""
                ALTER TABLE "Answers" DROP CONSTRAINT IF EXISTS "FK_Answers_Questions_QuestionId";
                ALTER TABLE "SessionGuesses" DROP CONSTRAINT IF EXISTS "FK_SessionGuesses_GameSessions_SessionId";

                ALTER TABLE "Questions"
                    ALTER COLUMN "Id" TYPE uuid USING "Id"::uuid;

                ALTER TABLE "Answers"
                    ALTER COLUMN "Id" TYPE uuid USING "Id"::uuid,
                    ALTER COLUMN "QuestionId" TYPE uuid USING "QuestionId"::uuid;

                ALTER TABLE "GameSessions"
                    ALTER COLUMN "SessionId" TYPE uuid USING "SessionId"::uuid,
                    ALTER COLUMN "QuestionId" TYPE uuid USING "QuestionId"::uuid,
                    ALTER COLUMN "CreatedAt" TYPE timestamp with time zone USING "CreatedAt"::timestamptz,
                    ALTER COLUMN "UpdatedAt" TYPE timestamp with time zone USING "UpdatedAt"::timestamptz;

                ALTER TABLE "SessionGuesses"
                    ALTER COLUMN "Id" TYPE uuid USING "Id"::uuid,
                    ALTER COLUMN "SessionId" TYPE uuid USING "SessionId"::uuid,
                    ALTER COLUMN "QuestionId" TYPE uuid USING "QuestionId"::uuid,
                    ALTER COLUMN "CreatedAt" TYPE timestamp with time zone USING "CreatedAt"::timestamptz;

                ALTER TABLE "Answers"
                    ADD CONSTRAINT "FK_Answers_Questions_QuestionId"
                    FOREIGN KEY ("QuestionId") REFERENCES "Questions" ("Id") ON DELETE CASCADE;

                ALTER TABLE "SessionGuesses"
                    ADD CONSTRAINT "FK_SessionGuesses_GameSessions_SessionId"
                    FOREIGN KEY ("SessionId") REFERENCES "GameSessions" ("SessionId") ON DELETE CASCADE;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            if (!ActiveProvider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            migrationBuilder.Sql("""
                ALTER TABLE "Answers" DROP CONSTRAINT IF EXISTS "FK_Answers_Questions_QuestionId";
                ALTER TABLE "SessionGuesses" DROP CONSTRAINT IF EXISTS "FK_SessionGuesses_GameSessions_SessionId";

                ALTER TABLE "Questions"
                    ALTER COLUMN "Id" TYPE text USING "Id"::text;

                ALTER TABLE "Answers"
                    ALTER COLUMN "Id" TYPE text USING "Id"::text,
                    ALTER COLUMN "QuestionId" TYPE text USING "QuestionId"::text;

                ALTER TABLE "GameSessions"
                    ALTER COLUMN "SessionId" TYPE text USING "SessionId"::text,
                    ALTER COLUMN "QuestionId" TYPE text USING "QuestionId"::text,
                    ALTER COLUMN "CreatedAt" TYPE text USING "CreatedAt"::text,
                    ALTER COLUMN "UpdatedAt" TYPE text USING "UpdatedAt"::text;

                ALTER TABLE "SessionGuesses"
                    ALTER COLUMN "Id" TYPE text USING "Id"::text,
                    ALTER COLUMN "SessionId" TYPE text USING "SessionId"::text,
                    ALTER COLUMN "QuestionId" TYPE text USING "QuestionId"::text,
                    ALTER COLUMN "CreatedAt" TYPE text USING "CreatedAt"::text;

                ALTER TABLE "Answers"
                    ADD CONSTRAINT "FK_Answers_Questions_QuestionId"
                    FOREIGN KEY ("QuestionId") REFERENCES "Questions" ("Id") ON DELETE CASCADE;

                ALTER TABLE "SessionGuesses"
                    ADD CONSTRAINT "FK_SessionGuesses_GameSessions_SessionId"
                    FOREIGN KEY ("SessionId") REFERENCES "GameSessions" ("SessionId") ON DELETE CASCADE;
                """);
        }
    }
}

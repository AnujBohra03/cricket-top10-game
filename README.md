# Cricket Top 10 Game

Production-hardening baseline implemented:
- Versioned API routes under `/api/v1`
- JWT-protected admin APIs
- Global exception handling with `application/problem+json`
- Correlation ID middleware (`X-Correlation-Id`)
- Rate limiting policy for gameplay APIs
- Async EF Core request path
- PostgreSQL-ready connection-string detection (with SQLite fallback)
- Normalized session guesses (`SessionGuesses` table)
- Unified guess response with updated game state

## Backend config
Set these in environment variables for production:
- `ConnectionStrings__DefaultConnection`
- `Jwt__SecretKey`
- `AdminAuth__Username`
- `AdminAuth__Password`

Default local run:
- backend: `cd backend/CricketTop10Game.Api && dotnet run`
- frontend: `cd frontend/cricket-top10-ui && npm run dev`

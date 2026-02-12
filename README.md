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

## Local PostgreSQL (dev + prd)
1. Start PostgreSQL in Docker:
   - `docker compose up -d`
2. Create both databases:
   - `./scripts/setup-postgres-databases.sh`
3. Connect backend to dev DB:
   - `ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=cricket_top10_dev;Username=cricket;Password=cricket123" dotnet run --project backend/CricketTop10Game.Api`
4. Connect backend to prd DB (for local testing only):
   - `ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=cricket_top10_prd;Username=cricket;Password=cricket123" dotnet run --project backend/CricketTop10Game.Api`

DBeaver connection details:
- Host: `localhost`
- Port: `5432`
- User: `cricket`
- Password: `cricket123`
- Database: `cricket_top10_dev` or `cricket_top10_prd`

## Production readiness settings (Render)
Set these environment variables in Render:
- `ConnectionStrings__DefaultConnection`
- `Jwt__SecretKey`
- `AdminAuth__Username`
- `AdminAuth__Password`
- `Database__RunMigrationsOnStartup=true`
- `Database__AllowDevEnsureCreatedFallback=false`

Startup behavior:
- Production: runs `Database.Migrate()` and does not fall back to `EnsureCreated()`.
- Development: runs `Database.Migrate()` and can fall back to `EnsureCreated()` if enabled.

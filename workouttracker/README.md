# Workout Tracker API

A SQLite-backed REST API for accounts, exercise data, workout plans, scheduling, completion logs, and progress reports.

## Run

```powershell
npm install
npm start
```

The server listens on `http://localhost:3000`. Set `JWT_SECRET`, `PORT`, or `DB_PATH` in `.env`; `DB_PATH` defaults to `backend/workouttracker.db`.

## API

The complete OpenAPI 3 document is in [openapi.json](openapi.json).

Public endpoints:

- `POST /api/auth/signup` with `{ "email": "alex@example.com", "password": "password123" }`
- `POST /api/auth/login` with the same credentials
- `GET /api/exercises`
- `GET /api/health`

Send the login `token` as `Authorization: Bearer <token>` for protected endpoints:

```json
{
  "name": "Push day",
  "scheduledAt": "2026-09-01T18:00:00Z",
  "comments": "Progressive overload",
  "exercises": [{ "exerciseId": 2, "sets": 3, "repetitions": 8, "weight": 60 }]
}
```

- `GET /api/workouts?status=pending|active|completed`
- `POST /api/workouts`
- `GET`, `PATCH`, `DELETE /api/workouts/:id`
- `POST /api/workouts/:id/logs`
- `GET /api/reports/progress`
- `POST /api/auth/logout`

Logout is stateless: clients should discard the JWT. Tokens expire after two hours.

## Test

```powershell
npm test
```

Tests use an in-memory SQLite database and verify exercise seeding, JWT-protected writes, workout creation, ownership isolation, logs, and reports.

I have a good understanding of how to create a real-time leaderboard system that updates scores in real-time. 
I also gained experience working with Redis sorted sets and implementing user authentication and score submission features.

https://roadmap.sh/projects/realtime-leaderboard-system

## db->postgress.js
# pool:
Instead of creating a brand-new database connection for every request,
a connection pool keeps several connections available,
When a request needs PostgreSQL, it borrows one.



## server.js
1.always require("dotenv").config() at the top
2.always borrow app.js here
3.listen to the port

## routes
1.always reuqire express and its router

## Setup

Create a PostgreSQL database named `leaderboard`, start Redis on port `6379`, and set these values in `.env`:

```env
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DB=leaderboard
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_this_value
```

Install and start the API with `npm install` and `npm start`. The server creates the `users` and `scores` tables on startup.

## API flow

1. Register: `POST /api/auth/register` with `{"username":"alex","email":"alex@example.com","password":"secret123"}`.
2. Log in: `POST /api/auth/login`, then save the returned JWT.
3. Submit a score: `POST /api/scores` with `Authorization: Bearer <token>` and `{"game":"chess","score":1200}`.
4. Read rankings: `GET /api/scores/leaderboard` or add `?game=chess`.
5. Read your ranking: `GET /api/scores/me/ranking`.
6. Generate a report: `GET /api/scores/report?days=30`, optionally adding `&game=chess`.
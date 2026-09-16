const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.POSTGRES_USER || "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    database: process.env.POSTGRES_DB || "leaderboard",
    password: process.env.POSTGRES_PASSWORD || process.env.POSTGRESS_PASSWORD,
    port: Number(process.env.POSTGRES_PORT || 5432)
});

const initializeDatabase = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS scores (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            game VARCHAR(100) NOT NULL,
            score INTEGER NOT NULL CHECK (score >= 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS scores_created_at_idx ON scores(created_at);
        CREATE INDEX IF NOT EXISTS scores_game_idx ON scores(game);
    `);
};

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
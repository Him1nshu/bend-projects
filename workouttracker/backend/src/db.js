const Database = require('better-sqlite3');
const path = require('node:path');

const databasePath = process.env.DB_PATH || path.join(__dirname, '..', 'workouttracker.db');
const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    muscle_group TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    comments TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workout_exercises (
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    sets INTEGER NOT NULL CHECK(sets > 0),
    repetitions INTEGER NOT NULL CHECK(repetitions > 0),
    weight REAL NOT NULL DEFAULT 0 CHECK(weight >= 0),
    PRIMARY KEY (workout_id, exercise_id)
  );
  CREATE TABLE IF NOT EXISTS workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    performed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER CHECK(duration_minutes IS NULL OR duration_minutes > 0),
    notes TEXT NOT NULL DEFAULT ''
  );
`);

module.exports = db;

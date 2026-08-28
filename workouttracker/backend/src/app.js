const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { authenticate, secret } = require('./auth');
require('./seed');

const app = express();
app.use(express.json());

const workoutSelect = `SELECT w.id, w.name, w.scheduled_at AS scheduledAt, w.comments, w.status,
	w.created_at AS createdAt, w.updated_at AS updatedAt FROM workouts w WHERE w.id = ? AND w.user_id = ?`;

function workoutWithExercises(id, userId) {
	const workout = db.prepare(workoutSelect).get(id, userId);
	if (!workout) return null;
	workout.exercises = db.prepare(`SELECT e.id, e.name, e.description, e.category, e.muscle_group AS muscleGroup,
		we.sets, we.repetitions, we.weight FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
		WHERE we.workout_id = ? ORDER BY we.rowid`).all(id);
	return workout;
}

function validateWorkout(body) {
	if (!body.name || !body.scheduledAt || !Array.isArray(body.exercises) || body.exercises.length === 0) {
		return 'name, scheduledAt, and at least one exercise are required';
	}
	if (Number.isNaN(Date.parse(body.scheduledAt))) return 'scheduledAt must be a valid date';
	if (body.exercises.some((item) => !Number.isInteger(item.exerciseId || item.id) || item.sets < 1 || item.repetitions < 1 || item.weight < 0)) {
		return 'each exercise needs a valid exerciseId, positive sets/repetitions, and non-negative weight';
	}
	return null;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/signup', async (req, res) => {
	const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
	if (!email || typeof req.body.password !== 'string' || req.body.password.length < 8) {
		return res.status(400).json({ error: 'A valid email and password of at least 8 characters are required' });
	}
	try {
		const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, await bcrypt.hash(req.body.password, 12));
		const token = jwt.sign({ id: result.lastInsertRowid, email }, secret, { expiresIn: '2h' });
		return res.status(201).json({ token, user: { id: result.lastInsertRowid, email } });
	} catch (error) {
		if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Email is already registered' });
		throw error;
	}
});

app.post('/api/auth/login', async (req, res) => {
	const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(req.body.email || '').trim());
	if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) {
		return res.status(401).json({ error: 'Invalid email or password' });
	}
	res.json({ token: jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '2h' }), user: { id: user.id, email: user.email } });
});

app.post('/api/auth/logout', authenticate, (req, res) => res.status(204).send());
app.get('/api/exercises', (req, res) => res.json(db.prepare('SELECT id, name, description, category, muscle_group AS muscleGroup FROM exercises ORDER BY name').all()));

app.get('/api/workouts', authenticate, (req, res) => {
	const allowed = ['pending', 'active', 'completed'];
	const status = allowed.includes(req.query.status) ? ' AND status = ?' : '';
	const args = [req.user.id];
	if (status) args.push(req.query.status);
	const rows = db.prepare(`SELECT id, name, scheduled_at AS scheduledAt, comments, status FROM workouts WHERE user_id = ?${status} ORDER BY scheduled_at`).all(...args);
	res.json(rows);
});

app.post('/api/workouts', authenticate, (req, res) => {
	const error = validateWorkout(req.body);
	if (error) return res.status(400).json({ error });
	const create = db.transaction(() => {
		const workout = db.prepare('INSERT INTO workouts (user_id, name, scheduled_at, comments, status) VALUES (?, ?, ?, ?, ?)').run(req.user.id, req.body.name, req.body.scheduledAt, req.body.comments || '', req.body.status || 'pending');
		const add = db.prepare('INSERT INTO workout_exercises (workout_id, exercise_id, sets, repetitions, weight) VALUES (?, ?, ?, ?, ?)');
		req.body.exercises.forEach((item) => add.run(workout.lastInsertRowid, item.exerciseId, item.sets, item.repetitions, item.weight || 0));
		return workout.lastInsertRowid;
	});
	try { return res.status(201).json(workoutWithExercises(create(), req.user.id)); } catch (e) { return res.status(400).json({ error: 'One or more exercise IDs do not exist' }); }
});

app.get('/api/workouts/:id', authenticate, (req, res) => {
	const workout = workoutWithExercises(req.params.id, req.user.id);
	res.status(workout ? 200 : 404).json(workout || { error: 'Workout not found' });
});

app.patch('/api/workouts/:id', authenticate, (req, res) => {
	const current = workoutWithExercises(req.params.id, req.user.id);
	if (!current) return res.status(404).json({ error: 'Workout not found' });
	const next = { ...current, ...req.body, exercises: req.body.exercises || current.exercises };
	const error = validateWorkout(next);
	if (error) return res.status(400).json({ error });
	try {
		db.transaction(() => {
			db.prepare('UPDATE workouts SET name = ?, scheduled_at = ?, comments = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(next.name, next.scheduledAt, next.comments || '', next.status || current.status, req.params.id, req.user.id);
			db.prepare('DELETE FROM workout_exercises WHERE workout_id = ?').run(req.params.id);
			const add = db.prepare('INSERT INTO workout_exercises (workout_id, exercise_id, sets, repetitions, weight) VALUES (?, ?, ?, ?, ?)');
			next.exercises.forEach((item) => add.run(req.params.id, item.exerciseId || item.id, item.sets, item.repetitions, item.weight || 0));
		})();
		res.json(workoutWithExercises(req.params.id, req.user.id));
	} catch { res.status(400).json({ error: 'Invalid workout or exercise data' }); }
});

app.delete('/api/workouts/:id', authenticate, (req, res) => {
	const result = db.prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
	res.status(result.changes ? 204 : 404).send(result.changes ? undefined : { error: 'Workout not found' });
});

app.post('/api/workouts/:id/logs', authenticate, (req, res) => {
	if (!workoutWithExercises(req.params.id, req.user.id)) return res.status(404).json({ error: 'Workout not found' });
	const log = db.prepare('INSERT INTO workout_logs (workout_id, user_id, performed_at, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)').run(req.params.id, req.user.id, req.body.performedAt || new Date().toISOString(), req.body.durationMinutes || null, req.body.notes || '');
	db.prepare("UPDATE workouts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
	res.status(201).json(db.prepare('SELECT id, workout_id AS workoutId, performed_at AS performedAt, duration_minutes AS durationMinutes, notes FROM workout_logs WHERE id = ?').get(log.lastInsertRowid));
});

app.get('/api/reports/progress', authenticate, (req, res) => {
	const logs = db.prepare(`SELECT wl.performed_at AS performedAt, w.name AS workout, wl.duration_minutes AS durationMinutes, wl.notes
		FROM workout_logs wl JOIN workouts w ON w.id = wl.workout_id WHERE wl.user_id = ? ORDER BY wl.performed_at DESC`).all(req.user.id);
	res.json({ totalWorkouts: logs.length, totalMinutes: logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0), workouts: logs });
});

app.use((error, req, res, next) => { console.error(error); res.status(500).json({ error: 'Internal server error' }); });
module.exports = app;
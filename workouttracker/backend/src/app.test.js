process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('./app');

async function signup(email) {
  const response = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
  return response.body.token;
}

test('seeds exercises and protects workout ownership', async () => {
  const exercises = await request(app).get('/api/exercises');
  assert.equal(exercises.status, 200);
  assert.ok(exercises.body.length >= 6);

  const ownerToken = await signup('owner@example.com');
  const otherToken = await signup('other@example.com');
  const created = await request(app).post('/api/workouts').set('Authorization', `Bearer ${ownerToken}`).send({
    name: 'Push day', scheduledAt: '2026-09-01T18:00:00Z', comments: 'Progressive overload',
    exercises: [{ exerciseId: exercises.body.find((item) => item.name === 'Bench Press').id, sets: 3, repetitions: 8, weight: 60 }]
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.exercises.length, 1);

  const updated = await request(app).patch(`/api/workouts/${created.body.id}`).set('Authorization', `Bearer ${ownerToken}`).send({ comments: 'Updated note' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.comments, 'Updated note');

  const forbidden = await request(app).get(`/api/workouts/${created.body.id}`).set('Authorization', `Bearer ${otherToken}`);
  assert.equal(forbidden.status, 404);

  const log = await request(app).post(`/api/workouts/${created.body.id}/logs`).set('Authorization', `Bearer ${ownerToken}`).send({ durationMinutes: 45 });
  assert.equal(log.status, 201);
  const report = await request(app).get('/api/reports/progress').set('Authorization', `Bearer ${ownerToken}`);
  assert.deepEqual({ totalWorkouts: report.body.totalWorkouts, totalMinutes: report.body.totalMinutes }, { totalWorkouts: 1, totalMinutes: 45 });
});

test('rejects unauthenticated writes', async () => {
  const response = await request(app).post('/api/workouts').send({});
  assert.equal(response.status, 401);
});

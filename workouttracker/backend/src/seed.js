const db = require('./db');

const exercises = [
  ['Running', 'Steady-state cardiovascular exercise.', 'cardio', 'legs'],
  ['Bench Press', 'Press a barbell from the chest while lying down.', 'strength', 'chest'],
  ['Pull-up', 'Pull the body upward from a hanging position.', 'strength', 'back'],
  ['Bodyweight Squat', 'Lower and raise the body with a hip-width stance.', 'strength', 'legs'],
  ['Plank', 'Hold a stable straight-body position on the forearms.', 'strength', 'core'],
  ['Hamstring Stretch', 'Seated stretch for the back of the legs.', 'flexibility', 'legs']
];

const insert = db.prepare(`INSERT OR IGNORE INTO exercises
  (name, description, category, muscle_group) VALUES (?, ?, ?, ?)`);
db.transaction(() => exercises.forEach((exercise) => insert.run(...exercise)))();

module.exports = exercises;

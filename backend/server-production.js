const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jobRoutes = require('./src/routes/jobs');
const recruiterRoutes = require('./src/routes/recruiters');
const lookupRoutes = require('./src/routes/lookup');
const outreachRoutes = require('./src/routes/outreach');
const todoRoutes = require('./src/routes/todos');
const timeTrackingRoutes = require('./src/routes/timeTracking');
const tagsRoutes = require('./src/routes/tags');
const dependenciesRoutes = require('./src/routes/dependencies');
const recommendationsRoutes = require('./src/routes/recommendations');
const { startFollowUpWorker, checkFollowUps } = require('./src/workers/followUpWorker');
const { startTodoReminderWorker, checkTodoReminders } = require('./src/workers/todoReminderWorker');
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API Routes
app.use('/jobs', jobRoutes);
app.use('/recruiters', recruiterRoutes);
app.use('/lookup', lookupRoutes);
app.use('/outreach', outreachRoutes);
app.use('/todos', todoRoutes);
app.use('/api', timeTrackingRoutes);
app.use('/api', tagsRoutes);
app.use('/api', dependenciesRoutes);
app.use('/api', recommendationsRoutes);

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'ok', db: 'error', message: err.message });
  }
});

// Manual trigger for testing
app.get('/test/followups', async (req, res) => {
  await checkFollowUps();
  res.json({ message: 'Follow-up check triggered — check your email and terminal' });
});

app.get('/test/todo-reminders', async (req, res) => {
  await checkTodoReminders();
  res.json({ message: 'Todo reminder check triggered — check your email' });
});

// Serve React app for all other routes
// app.get('(.*)', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startFollowUpWorker();
  startTodoReminderWorker();
});

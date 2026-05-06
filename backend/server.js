const express = require('express');
const cors = require('cors');
require('dotenv').config();

const jobRoutes = require('./src/routes/jobs');
const recruiterRoutes = require('./src/routes/recruiters');
const lookupRoutes = require('./src/routes/lookup');
const outreachRoutes = require('./src/routes/outreach');
const todoRoutes = require('./src/routes/todos');
const { startFollowUpWorker, checkFollowUps } = require('./src/workers/followUpWorker');
const { startTodoReminderWorker, checkTodoReminders } = require('./src/workers/todoReminderWorker');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/jobs', jobRoutes);
app.use('/recruiters', recruiterRoutes);
app.use('/lookup', lookupRoutes);
app.use('/outreach', outreachRoutes);
app.use('/todos', todoRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Manual trigger for testing
app.get('/test/followups', async (req, res) => {
  await checkFollowUps();
  res.json({ message: 'Follow-up check triggered — check your email and terminal' });
});

app.get('/test/todo-reminders', async (req, res) => {
  await checkTodoReminders();
  res.json({ message: 'Todo reminder check triggered — check your email' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startFollowUpWorker();
  startTodoReminderWorker();
});

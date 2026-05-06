const express = require('express');
const router = express.Router();
const db = require('../config/db'); // your existing MySQL pool/connection

// ─────────────────────────────────────────────
// Helper: auto-create next recurrence after completion
// ─────────────────────────────────────────────
async function createNextRecurrence(todo) {
  if (!todo.is_recurring || !todo.recur_every || !todo.due_date) return;

  const current = new Date(todo.due_date);
  let next = new Date(current);

  if (todo.recur_every === 'Daily')   next.setDate(current.getDate() + 1);
  if (todo.recur_every === 'Weekly')  next.setDate(current.getDate() + 7);
  if (todo.recur_every === 'Monthly') next.setMonth(current.getMonth() + 1);

  const nextDate = next.toISOString().split('T')[0];

  await db.query(
    `INSERT INTO todos (title, notes, category, priority, status, due_date, due_time, is_recurring, recur_every)
     VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?)`,
    [
      todo.title,
      todo.notes,
      todo.category,
      todo.priority,
      nextDate,
      todo.due_time || null,
      true,
      todo.recur_every,
    ]
  );
}

// ─────────────────────────────────────────────
// GET /todos — list all todos with subtasks
// Query params: category, priority, status, sort
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, priority, status, sort } = req.query;

    let query = 'SELECT * FROM todos WHERE 1=1';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    if (status)   { query += ' AND status = ?';   params.push(status); }

    if (sort === 'due_date')  query += ' ORDER BY due_date ASC, due_time ASC';
    else if (sort === 'priority') query += ' ORDER BY FIELD(priority, "High", "Medium", "Low")';
    else if (sort === 'created')  query += ' ORDER BY created_at DESC';
    else query += ' ORDER BY created_at DESC';

    const [todos] = await db.query(query, params);

    // Attach subtasks to each todo
    if (todos.length > 0) {
      const ids = todos.map(t => t.id);
      const [subtasks] = await db.query(
        `SELECT * FROM subtasks WHERE todo_id IN (?)`,
        [ids]
      );
      todos.forEach(todo => {
        todo.subtasks = subtasks.filter(s => s.todo_id === todo.id);
      });
    }

    res.json(todos);
  } catch (err) {
    console.error('GET /todos error:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// ─────────────────────────────────────────────
// GET /todos/:id — single todo with subtasks
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Todo not found' });

    const todo = rows[0];
    const [subtasks] = await db.query('SELECT * FROM subtasks WHERE todo_id = ?', [todo.id]);
    todo.subtasks = subtasks;

    res.json(todo);
  } catch (err) {
    console.error('GET /todos/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// ─────────────────────────────────────────────
// POST /todos — create a new todo
// Body: title, notes, category, priority, status,
//       due_date, due_time, is_recurring, recur_every, subtasks[]
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      title, notes, category, priority, status,
      due_date, due_time, is_recurring, recur_every,
      subtasks = []
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const [result] = await db.query(
      `INSERT INTO todos (title, notes, category, priority, status, due_date, due_time, is_recurring, recur_every)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        notes || null,
        category || 'Personal',
        priority || 'Medium',
        status || 'Pending',
        due_date || null,
        due_time || null,
        is_recurring || false,
        is_recurring ? recur_every : null,
      ]
    );

    const todoId = result.insertId;

    // Insert subtasks if provided
    if (subtasks.length > 0) {
      const subtaskValues = subtasks.map(s => [todoId, s.title || s]);
      await db.query(
        'INSERT INTO subtasks (todo_id, title) VALUES ?',
        [subtaskValues]
      );
    }

    // Fetch and return the created todo with subtasks
    const [rows] = await db.query('SELECT * FROM todos WHERE id = ?', [todoId]);
    const [subs] = await db.query('SELECT * FROM subtasks WHERE todo_id = ?', [todoId]);
    rows[0].subtasks = subs;

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /todos error:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// ─────────────────────────────────────────────
// PUT /todos/:id — edit a todo
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const {
      title, notes, category, priority, status,
      due_date, due_time, is_recurring, recur_every
    } = req.body;

    const [existing] = await db.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Todo not found' });

    await db.query(
      `UPDATE todos SET
        title = ?, notes = ?, category = ?, priority = ?,
        status = ?, due_date = ?, due_time = ?,
        is_recurring = ?, recur_every = ?
       WHERE id = ?`,
      [
        title || existing[0].title,
        notes !== undefined ? notes : existing[0].notes,
        category || existing[0].category,
        priority || existing[0].priority,
        status || existing[0].status,
        due_date !== undefined ? (due_date || null) : existing[0].due_date,
        due_time !== undefined ? (due_time || null) : existing[0].due_time,
        is_recurring !== undefined ? is_recurring : existing[0].is_recurring,
        is_recurring ? recur_every : null,
        req.params.id,
      ]
    );

    const [updated] = await db.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    const [subs] = await db.query('SELECT * FROM subtasks WHERE todo_id = ?', [req.params.id]);
    updated[0].subtasks = subs;

    res.json(updated[0]);
  } catch (err) {
    console.error('PUT /todos/:id error:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// ─────────────────────────────────────────────
// PATCH /todos/:id/complete — mark todo as complete
// Triggers next recurrence creation if recurring
// ─────────────────────────────────────────────
router.patch('/:id/complete', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Todo not found' });

    const todo = rows[0];

    await db.query(
      `UPDATE todos SET status = 'Completed', completed_at = NOW() WHERE id = ?`,
      [req.params.id]
    );

    // Auto-create next recurrence if needed
    await createNextRecurrence(todo);

    res.json({ message: 'Marked as complete', recurring: todo.is_recurring });
  } catch (err) {
    console.error('PATCH /todos/:id/complete error:', err);
    res.status(500).json({ error: 'Failed to complete todo' });
  }
});

// ─────────────────────────────────────────────
// DELETE /todos/:id — delete a todo (subtasks auto-deleted via CASCADE)
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM todos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Todo not found' });

    await db.query('DELETE FROM todos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error('DELETE /todos/:id error:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// ─────────────────────────────────────────────
// POST /todos/:id/subtasks — add a subtask
// ─────────────────────────────────────────────
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Subtask title is required' });

    const [todo] = await db.query('SELECT id FROM todos WHERE id = ?', [req.params.id]);
    if (!todo.length) return res.status(404).json({ error: 'Todo not found' });

    const [result] = await db.query(
      'INSERT INTO subtasks (todo_id, title) VALUES (?, ?)',
      [req.params.id, title]
    );

    const [created] = await db.query('SELECT * FROM subtasks WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('POST /todos/:id/subtasks error:', err);
    res.status(500).json({ error: 'Failed to add subtask' });
  }
});

// ─────────────────────────────────────────────
// PATCH /subtasks/:id — toggle subtask done/undone
// ─────────────────────────────────────────────
router.patch('/subtasks/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM subtasks WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Subtask not found' });

    const newDone = !rows[0].is_done;
    await db.query('UPDATE subtasks SET is_done = ? WHERE id = ?', [newDone, req.params.id]);

    res.json({ id: rows[0].id, is_done: newDone });
  } catch (err) {
    console.error('PATCH /subtasks/:id error:', err);
    res.status(500).json({ error: 'Failed to toggle subtask' });
  }
});

// ─────────────────────────────────────────────
// DELETE /subtasks/:id — delete a subtask
// ─────────────────────────────────────────────
router.delete('/subtasks/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM subtasks WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Subtask not found' });

    await db.query('DELETE FROM subtasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Subtask deleted' });
  } catch (err) {
    console.error('DELETE /subtasks/:id error:', err);
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─────────────────────────────────────────────
// GET /api/dependencies - Get all dependencies
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [dependencies] = await db.query(`
      SELECT td.*, t1.title as todo_title, t2.title as blocks_todo_title
      FROM task_dependencies td
      JOIN todos t1 ON td.todo_id = t1.id
      JOIN todos t2 ON td.blocks_todo_id = t2.id
      ORDER BY td.created_at DESC
    `);
    res.json(dependencies);
  } catch (err) {
    console.error('GET /api/dependencies error:', err);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

// ─────────────────────────────────────────────
// GET /api/dependencies/:todoId - Get dependencies for a specific todo
// ─────────────────────────────────────────────
router.get('/:todoId', async (req, res) => {
  try {
    const todoId = req.params.todoId;
    
    const [dependencies] = await db.query(`
      SELECT td.*, t.title as blocks_todo_title, t.priority as blocks_priority, t.status as blocks_status
      FROM task_dependencies td
      JOIN todos t ON td.blocks_todo_id = t.id
      WHERE td.todo_id = ?
      ORDER BY t.priority DESC, t.created_at ASC
    `, [todoId]);
    
    res.json(dependencies);
  } catch (err) {
    console.error('GET /api/dependencies/:todoId error:', err);
    res.status(500).json({ error: 'Failed to fetch todo dependencies' });
  }
});

// ─────────────────────────────────────────────
// POST /api/dependencies - Create a dependency
// Body: { todo_id, blocks_todo_id }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { todo_id, blocks_todo_id } = req.body;
    
    if (!todo_id || !blocks_todo_id) {
      return res.status(400).json({ error: 'todo_id and blocks_todo_id are required' });
    }

    // Prevent circular dependencies
    const [circularCheck] = await db.query(
      'SELECT id FROM task_dependencies WHERE todo_id = ? AND blocks_todo_id = ?',
      [blocks_todo_id, todo_id]
    );
    
    if (circularCheck.length > 0) {
      return res.status(400).json({ error: 'Circular dependency detected' });
    }

    // Verify both todos exist
    const [todo1] = await db.query('SELECT id FROM todos WHERE id = ?', [todo_id]);
    const [todo2] = await db.query('SELECT id FROM todos WHERE id = ?', [blocks_todo_id]);
    
    if (!todo1.length || !todo2.length) {
      return res.status(404).json({ error: 'One or both todos not found' });
    }

    const [result] = await db.query(
      'INSERT INTO task_dependencies (todo_id, blocks_todo_id) VALUES (?, ?)',
      [todo_id, blocks_todo_id]
    );

    // Update dependency status
    await updateDependencyStatus(todo_id);

    const [created] = await db.query(`
      SELECT td.*, t1.title as todo_title, t2.title as blocks_todo_title
      FROM task_dependencies td
      JOIN todos t1 ON td.todo_id = t1.id
      JOIN todos t2 ON td.blocks_todo_id = t2.id
      WHERE td.id = ?
    `, [result.insertId]);

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('POST /api/dependencies error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Dependency already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create dependency' });
    }
  }
});

// ─────────────────────────────────────────────
// DELETE /api/dependencies/:id - Delete a dependency
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const dependencyId = req.params.id;

    const [dependency] = await db.query(
      'SELECT todo_id FROM task_dependencies WHERE id = ?',
      [dependencyId]
    );
    
    if (!dependency.length) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    await db.query('DELETE FROM task_dependencies WHERE id = ?', [dependencyId]);
    
    // Update dependency status
    await updateDependencyStatus(dependency[0].todo_id);

    res.json({ message: 'Dependency deleted' });
  } catch (err) {
    console.error('DELETE /api/dependencies/:id error:', err);
    res.status(500).json({ error: 'Failed to delete dependency' });
  }
});

// ─────────────────────────────────────────────
// Helper function to update dependency status
// ─────────────────────────────────────────────
async function updateDependencyStatus(todoId) {
  // Check if todo has any incomplete dependencies
  const [incompleteDeps] = await db.query(`
    SELECT COUNT(*) as count
    FROM task_dependencies td
    JOIN todos t ON td.blocks_todo_id = t.id
    WHERE td.todo_id = ? AND t.status != 'Completed'
  `, [todoId]);

  const hasIncompleteDeps = incompleteDeps[0].count > 0;
  const newStatus = hasIncompleteDeps ? 'blocked' : 'ready';

  await db.query(
    'UPDATE todos SET dependency_status = ? WHERE id = ?',
    [newStatus, todoId]
  );
}

module.exports = router;

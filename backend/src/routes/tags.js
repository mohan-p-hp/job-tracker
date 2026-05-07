const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─────────────────────────────────────────────
// GET /api/tags - Get all tags
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [tags] = await db.query('SELECT * FROM tags ORDER BY name');
    res.json(tags);
  } catch (err) {
    console.error('GET /api/tags error:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ─────────────────────────────────────────────
// POST /api/tags - Create a new tag
// Body: { name, color }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      [name.trim(), color || '#3B82F6']
    );

    const [created] = await db.query('SELECT * FROM tags WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('POST /api/tags error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Tag already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create tag' });
    }
  }
});

// ─────────────────────────────────────────────
// PUT /api/tags/:id - Update a tag
// Body: { name, color }
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const tagId = req.params.id;

    const [existing] = await db.query('SELECT id FROM tags WHERE id = ?', [tagId]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await db.query(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [name.trim(), color || '#3B82F6', tagId]
    );

    const [updated] = await db.query('SELECT * FROM tags WHERE id = ?', [tagId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('PUT /api/tags/:id error:', err);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/tags/:id - Delete a tag
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const tagId = req.params.id;

    const [existing] = await db.query('SELECT id FROM tags WHERE id = ?', [tagId]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await db.query('DELETE FROM tags WHERE id = ?', [tagId]);
    res.json({ message: 'Tag deleted' });
  } catch (err) {
    console.error('DELETE /api/tags/:id error:', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ─────────────────────────────────────────────
// GET /api/todos/:id/tags - Get tags for a specific todo
// ─────────────────────────────────────────────
router.get('/todos/:id/tags', async (req, res) => {
  try {
    const todoId = req.params.id;

    const [tags] = await db.query(`
      SELECT t.* FROM tags t
      JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
      ORDER BY t.name
    `, [todoId]);

    res.json(tags);
  } catch (err) {
    console.error('GET /api/todos/:id/tags error:', err);
    res.status(500).json({ error: 'Failed to fetch todo tags' });
  }
});

// ─────────────────────────────────────────────
// POST /api/todos/:id/tags - Add tag to todo
// Body: { tag_id }
// ─────────────────────────────────────────────
router.post('/todos/:id/tags', async (req, res) => {
  try {
    const { tag_id } = req.body;
    const todoId = req.params.id;

    if (!tag_id) {
      return res.status(400).json({ error: 'tag_id is required' });
    }

    // Verify todo and tag exist
    const [todo] = await db.query('SELECT id FROM todos WHERE id = ?', [todoId]);
    const [tag] = await db.query('SELECT id FROM tags WHERE id = ?', [tag_id]);
    
    if (!todo.length || !tag.length) {
      return res.status(404).json({ error: 'Todo or tag not found' });
    }

    // Check if already tagged
    const [existing] = await db.query(
      'SELECT todo_id FROM todo_tags WHERE todo_id = ? AND tag_id = ?',
      [todoId, tag_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Todo already has this tag' });
    }

    await db.query(
      'INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)',
      [todoId, tag_id]
    );

    const [addedTag] = await db.query('SELECT * FROM tags WHERE id = ?', [tag_id]);
    res.status(201).json(addedTag[0]);
  } catch (err) {
    console.error('POST /api/todos/:id/tags error:', err);
    res.status(500).json({ error: 'Failed to add tag to todo' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/todos/:id/tags/:tagId - Remove tag from todo
// ─────────────────────────────────────────────
router.delete('/todos/:id/tags/:tagId', async (req, res) => {
  try {
    const { id: todoId, tagId } = req.params;

    await db.query(
      'DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?',
      [todoId, tagId]
    );

    res.json({ message: 'Tag removed from todo' });
  } catch (err) {
    console.error('DELETE /api/todos/:id/tags/:tagId error:', err);
    res.status(500).json({ error: 'Failed to remove tag from todo' });
  }
});

module.exports = router;

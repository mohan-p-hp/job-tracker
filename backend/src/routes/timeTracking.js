const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─────────────────────────────────────────────
// POST /time-sessions - Start a new time session
// Body: { todo_id, session_type, notes }
// ─────────────────────────────────────────────
router.post('/time-sessions', async (req, res) => {
  try {
    const { todo_id, session_type = 'manual', notes } = req.body;
    
    if (!todo_id) {
      return res.status(400).json({ error: 'todo_id is required' });
    }

    // Verify todo exists
    const [todo] = await db.query('SELECT id, title FROM todos WHERE id = ?', [todo_id]);
    if (!todo.length) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const [result] = await db.query(
      `INSERT INTO time_sessions (todo_id, start_time, session_type, notes)
       VALUES (?, NOW(), ?, ?)`,
      [todo_id, session_type, notes || null]
    );

    res.status(201).json({
      id: result.insertId,
      todo_id,
      start_time: new Date().toISOString(),
      session_type,
      notes,
      message: 'Time session started'
    });
  } catch (err) {
    console.error('POST /time-sessions error:', err);
    res.status(500).json({ error: 'Failed to start time session' });
  }
});

// ─────────────────────────────────────────────
// PATCH /time-sessions/:id/end - End a time session
// ─────────────────────────────────────────────
router.patch('/time-sessions/:id/end', async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get session details
    const [session] = await db.query(
      'SELECT * FROM time_sessions WHERE id = ? AND end_time IS NULL',
      [sessionId]
    );
    
    if (!session.length) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const startTime = new Date(session[0].start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    // Update session
    await db.query(
      `UPDATE time_sessions 
       SET end_time = NOW(), duration_minutes = ?
       WHERE id = ?`,
      [durationMinutes, sessionId]
    );

    // Update todo's total time
    await db.query(
      `UPDATE todos 
       SET total_time_tracked = total_time_tracked + ?
       WHERE id = ?`,
      [durationMinutes, session[0].todo_id]
    );

    res.json({
      id: sessionId,
      duration_minutes: durationMinutes,
      end_time: endTime.toISOString(),
      message: 'Time session ended'
    });
  } catch (err) {
    console.error('PATCH /time-sessions/:id/end error:', err);
    res.status(500).json({ error: 'Failed to end time session' });
  }
});

// ─────────────────────────────────────────────
// GET /time-sessions - Get time sessions for a todo
// Query: todo_id, limit
// ─────────────────────────────────────────────
router.get('/time-sessions', async (req, res) => {
  try {
    const { todo_id, limit = 50 } = req.query;
    
    let query = `
      SELECT ts.*, t.title as todo_title
      FROM time_sessions ts
      JOIN todos t ON ts.todo_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (todo_id) {
      query += ' AND ts.todo_id = ?';
      params.push(todo_id);
    }

    query += ' ORDER BY ts.start_time DESC LIMIT ?';
    params.push(parseInt(limit));

    const [sessions] = await db.query(query, params);
    res.json(sessions);
  } catch (err) {
    console.error('GET /time-sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch time sessions' });
  }
});

// ─────────────────────────────────────────────
// GET /analytics/time - Get time tracking analytics
// ─────────────────────────────────────────────
router.get('/analytics/time', async (req, res) => {
  try {
    const [todayStats] = await db.query(`
      SELECT 
        COUNT(*) as sessions_today,
        COALESCE(SUM(duration_minutes), 0) as minutes_today
      FROM time_sessions 
      WHERE DATE(start_time) = CURDATE()
        AND duration_minutes IS NOT NULL
    `);

    const [weekStats] = await db.query(`
      SELECT 
        COUNT(*) as sessions_week,
        COALESCE(SUM(duration_minutes), 0) as minutes_week
      FROM time_sessions 
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND duration_minutes IS NOT NULL
    `);

    const [topTodos] = await db.query(`
      SELECT 
        t.id,
        t.title,
        COUNT(ts.id) as session_count,
        COALESCE(SUM(ts.duration_minutes), 0) as total_minutes
      FROM todos t
      LEFT JOIN time_sessions ts ON t.id = ts.todo_id
      WHERE ts.duration_minutes IS NOT NULL
      GROUP BY t.id, t.title
      ORDER BY total_minutes DESC
      LIMIT 10
    `);

    const [dailyBreakdown] = await db.query(`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as sessions,
        COALESCE(SUM(duration_minutes), 0) as minutes
      FROM time_sessions 
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND duration_minutes IS NOT NULL
      GROUP BY DATE(start_time)
      ORDER BY date DESC
      LIMIT 30
    `);

    res.json({
      today: todayStats[0] || { sessions_today: 0, minutes_today: 0 },
      week: weekStats[0] || { sessions_week: 0, minutes_week: 0 },
      top_todos: topTodos,
      daily_breakdown: dailyBreakdown
    });
  } catch (err) {
    console.error('GET /analytics/time error:', err);
    res.status(500).json({ error: 'Failed to fetch time analytics' });
  }
});

// ─────────────────────────────────────────────
// DELETE /time-sessions/:id - Delete a time session
// ─────────────────────────────────────────────
router.delete('/time-sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get session details before deletion
    const [session] = await db.query(
      'SELECT * FROM time_sessions WHERE id = ?',
      [sessionId]
    );
    
    if (!session.length) {
      return res.status(404).json({ error: 'Time session not found' });
    }

    // Update todo's total time if session had duration
    if (session[0].duration_minutes) {
      await db.query(
        `UPDATE todos 
         SET total_time_tracked = total_time_tracked - ?
         WHERE id = ?`,
        [session[0].duration_minutes, session[0].todo_id]
      );
    }

    // Delete session
    await db.query('DELETE FROM time_sessions WHERE id = ?', [sessionId]);

    res.json({ message: 'Time session deleted' });
  } catch (err) {
    console.error('DELETE /time-sessions/:id error:', err);
    res.status(500).json({ error: 'Failed to delete time session' });
  }
});

module.exports = router;

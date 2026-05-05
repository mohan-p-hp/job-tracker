const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /jobs — fetch all jobs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM job_applications ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /jobs/:id — fetch one job
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM job_applications WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /jobs — add a new job
router.post('/', async (req, res) => {
  try {
    const { company_name, job_title, job_url, platform, status, applied_at, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO job_applications 
       (company_name, job_title, job_url, platform, status, applied_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company_name, job_title, job_url, platform, status || 'Applied', applied_at, notes]
    );
    res.status(201).json({ id: result.insertId, message: 'Job added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /jobs/:id — update a job's status or details
router.put('/:id', async (req, res) => {
  try {
    const { company_name, job_title, job_url, platform, status, applied_at, notes } = req.body;
    await pool.query(
      `UPDATE job_applications 
       SET company_name=?, job_title=?, job_url=?, platform=?, status=?, applied_at=?, notes=?
       WHERE id=?`,
      [company_name, job_title, job_url, platform, status, applied_at, notes, req.params.id]
    );
    res.json({ message: 'Job updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /jobs/:id — delete a job
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM job_applications WHERE id = ?', [req.params.id]);
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

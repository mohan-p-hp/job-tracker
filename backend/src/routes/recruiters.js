const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /recruiters?application_id=X — get recruiters for a job
router.get('/', async (req, res) => {
  try {
    const { application_id } = req.query;
    const [rows] = await pool.query(
      'SELECT * FROM recruiters WHERE application_id = ?',
      [application_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /recruiters — save a recruiter contact
router.post('/', async (req, res) => {
  try {
    const { application_id, name, email, linkedin_url, company } = req.body;
    const [result] = await pool.query(
      `INSERT INTO recruiters (application_id, name, email, linkedin_url, company)
       VALUES (?, ?, ?, ?, ?)`,
      [application_id, name, email, linkedin_url, company]
    );
    res.status(201).json({ id: result.insertId, message: 'Recruiter saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

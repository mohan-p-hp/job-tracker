const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../config/db');
require('dotenv').config();

router.post('/send', async (req, res) => {
  const { recruiter_id, application_id, to_email, to_name, subject, message } = req.body;
  if (!to_email || !subject || !message)
    return res.status(400).json({ error: 'to_email, subject, and message are required' });

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: process.env.FROM_NAME, email: process.env.FROM_EMAIL },
        to: [{ email: to_email, name: to_name || to_email }],
        subject,
        htmlContent: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      }),
    });
    const brevoData = await brevoRes.json();
    if (!brevoRes.ok)
      return res.status(500).json({ error: brevoData.message || 'Brevo send failed' });

    await pool.query(
      `INSERT INTO outreach_logs (recruiter_id, application_id, channel, subject, message, sent_at, reply_received)
       VALUES (?, ?, 'email', ?, ?, NOW(), false)`,
      [recruiter_id || null, application_id || null, subject, message]
    );
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ol.*, r.name as recruiter_name, r.email as recruiter_email
       FROM outreach_logs ol
       LEFT JOIN recruiters r ON ol.recruiter_id = r.id
       WHERE ol.application_id = ?
       ORDER BY ol.sent_at DESC`,
      [req.query.application_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/reply/:id', async (req, res) => {
  try {
    await pool.query('UPDATE outreach_logs SET reply_received = true WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reply marked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ol.id,
        ol.subject,
        ol.sent_at,
        DATEDIFF(NOW(), ol.sent_at) AS days_ago,
        r.email AS recruiter_email,
        r.name AS recruiter_name,
        ja.company_name,
        ja.job_title
      FROM outreach_logs ol
      LEFT JOIN recruiters r ON ol.recruiter_id = r.id
      LEFT JOIN job_applications ja ON ol.application_id = ja.id
      WHERE ol.reply_received = false
        AND ol.sent_at <= DATE_SUB(NOW(), INTERVAL 5 DAY)
      ORDER BY ol.sent_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

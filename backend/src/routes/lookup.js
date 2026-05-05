const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../config/db');
require('dotenv').config();

async function getSnovToken() {
  const res = await fetch('https://api.snov.io/v1/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.SNOV_USER_ID,
      client_secret: process.env.SNOV_SECRET,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Snov.io auth failed — check your User ID and Secret');
  return data.access_token;
}

router.get('/recruiter', async (req, res) => {
  const { company, domain, application_id } = req.query;
  if (!domain) return res.status(400).json({ error: 'domain is required' });

  try {
    const token = await getSnovToken();
    const response = await fetch(
      `https://api.snov.io/v2/domain-emails-with-info?domain=${domain}&type=personal&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();

    if (!data.emails || data.emails.length === 0) {
      return res.json({
        recruiters: [],
        source: 'Snov.io',
        message: 'No contacts found — try a different domain or add manually',
      });
    }

    const hrKeywords = ['hr', 'recruit', 'talent', 'hiring', 'people', 'human resource'];
    let emails = data.emails.filter(e =>
      hrKeywords.some(k => (e.position || '').toLowerCase().includes(k))
    );
    if (emails.length === 0) emails = data.emails.slice(0, 5);

    const recruiters = emails.map(e => ({
      name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unknown',
      email: e.email,
      position: e.position || 'Unknown role',
      linkedin_url: '',
      confidence: e.confidence || 80,
      source: 'Snov.io',
    }));

    if (application_id) {
      for (const r of recruiters) {
        await pool.query(
          `INSERT IGNORE INTO recruiters (application_id, name, email, linkedin_url, company)
           VALUES (?, ?, ?, ?, ?)`,
          [application_id, r.name, r.email, '', company || domain]
        ).catch(() => {});
      }
    }

    res.json({
      recruiters,
      source: 'Snov.io',
      message: `Found ${recruiters.length} contacts via Snov.io`,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

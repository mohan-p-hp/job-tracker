const cron = require('node-cron');
const fetch = require('node-fetch');
const pool = require('../config/db');
require('dotenv').config();

async function sendReminderEmail(followUps) {
  if (followUps.length === 0) return;

  const listItems = followUps.map(f =>
    `<li><strong>${f.company_name}</strong> — ${f.job_title} (sent ${f.days_ago} days ago to ${f.recruiter_email || 'unknown'})</li>`
  ).join('');

  const htmlContent = `
    <h2>JobTracker — Follow-up Reminders</h2>
    <p>You have <strong>${followUps.length}</strong> outreach email(s) with no reply yet:</p>
    <ul>${listItems}</ul>
    <p>Log in to your JobTracker dashboard to send follow-ups or mark them as replied.</p>
  `;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: process.env.FROM_NAME, email: process.env.FROM_EMAIL },
        to: [{ email: process.env.FROM_EMAIL, name: process.env.FROM_NAME }],
        subject: `JobTracker — ${followUps.length} follow-up(s) due today`,
        htmlContent,
      }),
    });
    if (res.ok) console.log(`[FollowUpWorker] Reminder sent for ${followUps.length} follow-up(s)`);
    else {
      const err = await res.json();
      console.error('[FollowUpWorker] Brevo error:', err.message);
    }
  } catch (err) {
    console.error('[FollowUpWorker] Failed to send reminder:', err.message);
  }
}

async function checkFollowUps() {
  console.log('[FollowUpWorker] Checking for follow-ups due...');
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
    console.log(`[FollowUpWorker] Found ${rows.length} follow-up(s) due`);
    if (rows.length > 0) await sendReminderEmail(rows);
  } catch (err) {
    console.error('[FollowUpWorker] DB error:', err.message);
  }
}

function startFollowUpWorker() {
  cron.schedule('0 9 * * *', () => {
    console.log('[FollowUpWorker] Running daily check at 9:00 AM');
    checkFollowUps();
  });
  console.log('[FollowUpWorker] Scheduled — runs daily at 9:00 AM');
}

module.exports = { startFollowUpWorker, checkFollowUps };

const cron = require('node-cron');
const db = require('../config/db');

// ─────────────────────────────────────────────
// Send reminder email via Brevo (same as your follow-up worker)
// ─────────────────────────────────────────────
async function sendReminderEmail(todos) {
  const fetch = require('node-fetch');

  const priorityEmoji = { Urgent: '🔥', High: '🔴', Medium: '🟡', Low: '🟢' };
  const categoryEmoji = {
    Work: '💼', Personal: '👤', Shopping: '🛒',
    Health: '💪', Finance: '💰', Other: '📌'
  };

  const taskRows = todos.map(todo => {
    const emoji = priorityEmoji[todo.priority] || '⚪';
    const cat   = categoryEmoji[todo.category] || '📌';
    const time  = todo.due_time
      ? ` &nbsp;<span style="color:#888;font-size:13px;">(due ${formatTime(todo.due_time)})</span>` 
      : '';
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
          ${emoji} &nbsp;<strong>${todo.title}</strong>${time}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#555;">
          ${cat} ${todo.category}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#555;">
          ${todo.priority}
        </td>
      </tr>`;
  }).join('');

  const htmlBody = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#185FA5;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:20px;">📝 Your To-Do Reminders</h2>
        <p style="color:#cde;margin:6px 0 0;font-size:14px;">
          You have <strong>${todos.length}</strong> task${todos.length > 1 ? 's' : ''} due today
        </p>
      </div>
      <div style="background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Task</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Category</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Priority</th>
            </tr>
          </thead>
          <tbody>${taskRows}</tbody>
        </table>
        <div style="padding:20px 24px;text-align:center;">
          <a href="${process.env.APP_URL || 'http://localhost:5173'}/todos"
             style="background:#185FA5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
            Open Job Tracker →
          </a>
        </div>
      </div>
      <p style="text-align:center;color:#aaa;font-size:12px;margin-top:12px;">
        Sent by Job Tracker · ${new Date().toDateString()}
      </p>
    </div>`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.FROM_NAME || 'Job Tracker',
        email: process.env.FROM_EMAIL,
      },
      to: [{ email: process.env.FROM_EMAIL, name: process.env.FROM_NAME }],
      subject: `📝 You have ${todos.length} task${todos.length > 1 ? 's' : ''} due today!`,
      htmlContent: htmlBody,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[TodoReminder] Brevo error:', err);
  } else {
    console.log(`[TodoReminder] Reminder sent for ${todos.length} task(s)`);
  }
}

// ─────────────────────────────────────────────
// Format time: "14:30:00" → "2:30 PM"
// ─────────────────────────────────────────────
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─────────────────────────────────────────────
// Main check: find all tasks due today, not completed
// ─────────────────────────────────────────────
async function checkTodoReminders() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const [todos] = await db.query(
      `SELECT * FROM todos
       WHERE due_date = ?
         AND status != 'Completed'
       ORDER BY FIELD(priority, 'Urgent', 'High', 'Medium', 'Low'), due_time ASC`,
      [today]
    );

    if (todos.length === 0) {
      console.log('[TodoReminder] No tasks due today');
      return;
    }

    console.log(`[TodoReminder] Found ${todos.length} task(s) due today — sending email`);
    await sendReminderEmail(todos);
  } catch (err) {
    console.error('[TodoReminder] Error checking todos:', err);
  }
}

// ─────────────────────────────────────────────
// Start the cron worker
// Runs every day at 8:00 AM
// ─────────────────────────────────────────────
function startTodoReminderWorker() {
  console.log('[TodoReminder] Worker started — runs daily at 8:00 AM');

  cron.schedule('0 8 * * *', async () => {
    console.log('[TodoReminder] Running daily check...');
    await checkTodoReminders();
  });
}

module.exports = { startTodoReminderWorker, checkTodoReminders };

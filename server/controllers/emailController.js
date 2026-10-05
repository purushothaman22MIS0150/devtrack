const pool = require('../config/db');
require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Sends one email through Brevo's HTTPS API (works on free Render, unlike SMTP)
const sendMail = async ({ to, subject, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'DevTrack', email: process.env.SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorText}`);
  }
};

const checkDeadlines = async () => {
  try {
    const result = await pool.query(
      `SELECT t.title, t.deadline, u.email, u.name, p.title as project_title
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE t.deadline = CURRENT_DATE + INTERVAL '1 day'
       AND t.status != 'Done'`
    );

    for (const task of result.rows) {
      await sendMail({
        to: task.email,
        subject: `⚠️ Task Due Tomorrow: ${task.title}`,
        html: `
          <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4f46e5, #764ba2); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #fff; margin: 0;">⚡ DevTrack</h1>
              <p style="color: #a5b4fc; margin: 5px 0 0 0;">Deadline Reminder</p>
            </div>
            <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <h2 style="color: #1e1b4b;">Hi ${task.name}! 👋</h2>
              <p style="color: #666;">This is a reminder that the following task is due <strong>tomorrow</strong>:</p>
              <div style="background: #f8f9ff; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #1e1b4b; margin: 0 0 8px 0;">📋 ${task.title}</h3>
                <p style="color: #666; margin: 0;">📁 Project: ${task.project_title}</p>
                <p style="color: #666; margin: 5px 0 0 0;">📅 Due: ${new Date(task.deadline).toDateString()}</p>
              </div>
              <p style="color: #666;">Make sure to complete it on time. You got this! 💪</p>
              <a href="${FRONTEND_URL}/projects" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">View Task →</a>
            </div>
          </div>
        `,
      });
      console.log(`Deadline reminder sent to ${task.email} for task: ${task.title}`);
    }
  } catch (err) {
    console.error('Error sending deadline reminders:', err);
  }
};

const sendTestEmail = async (req, res) => {
  try {
    await sendMail({
      to: req.body.email,
      subject: '✅ DevTrack Email Test',
      html: `
        <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4f46e5, #764ba2); padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="color: #fff;">⚡ DevTrack</h1>
            <p style="color: #a5b4fc;">Email notifications are working!</p>
          </div>
        </div>
      `,
    });
    res.json({ message: 'Test email sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email' });
  }
};

const sendReminderNow = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.title, t.deadline, p.title AS project_title, u.email, u.name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE u.id = $1
       AND t.status != 'Done'
       AND t.deadline IS NOT NULL
       AND t.deadline <= CURRENT_DATE + INTERVAL '2 days'
       ORDER BY t.deadline ASC`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ message: 'No tasks are due soon. Nothing to send.' });
    }

    const { email, name } = result.rows[0];
    const rows = result.rows
      .map(t => `<li><strong>${t.title}</strong> (${t.project_title}) - due ${new Date(t.deadline).toDateString()}</li>`)
      .join('');

    await sendMail({
      to: email,
      subject: `⏰ DevTrack: ${result.rows.length} task(s) due soon`,
      html: `
        <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4f46e5, #764ba2); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0;">⚡ DevTrack</h1>
            <p style="color: #a5b4fc; margin: 5px 0 0 0;">Deadline Reminder</p>
          </div>
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #1e1b4b;">Hi ${name}! 👋</h2>
            <p style="color: #666;">These tasks are overdue or due within 2 days:</p>
            <ul style="color: #444; line-height: 1.8;">${rows}</ul>
          </div>
        </div>
      `,
    });

    res.json({ message: `Reminder sent to ${email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send reminder' });
  }
};

module.exports = { checkDeadlines, sendTestEmail, sendReminderNow };
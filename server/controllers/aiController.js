const pool = require('../config/db');
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getWeeklySummary = async (req, res) => {
  try {
    const tasksResult = await pool.query(
      `SELECT t.title, t.status, t.priority, p.title as project_title
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1
       AND t.created_at >= NOW() - INTERVAL '7 days'`,
      [req.user.id]
    );

    const logsResult = await pool.query(
      `SELECT tl.hours, tl.note, tl.log_date, t.title as task_title, p.title as project_title
       FROM time_logs tl
       JOIN tasks t ON tl.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       WHERE tl.user_id = $1
       AND tl.log_date >= NOW() - INTERVAL '7 days'`,
      [req.user.id]
    );

    const tasks = tasksResult.rows;
    const logs = logsResult.rows;
    const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours), 0).toFixed(1);
    const completedTasks = tasks.filter(t => t.status === 'Done').length;

    const prompt = `
You are a productivity coach. Analyze this developer's weekly activity and give a friendly, encouraging summary with insights and tips.

Weekly Activity:
- Total tasks this week: ${tasks.length}
- Completed tasks: ${completedTasks}
- In Progress: ${tasks.filter(t => t.status === 'In Progress').length}
- Total hours logged: ${totalHours}
- Number of work sessions: ${logs.length}

Tasks worked on:
${tasks.map(t => `- ${t.title} (${t.status}) - Priority: ${t.priority} - Project: ${t.project_title}`).join('\n')}

Time logs:
${logs.map(l => `- ${l.task_title}: ${l.hours}h on ${l.log_date} - ${l.note || 'No note'}`).join('\n')}

Please provide:
1. A brief summary of the week (2-3 sentences)
2. Key achievements
3. Areas to improve
4. Productivity tip for next week

Keep it friendly, concise and motivating.
    `;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content;
    res.json({ summary, stats: { totalHours, completedTasks, totalTasks: tasks.length, sessions: logs.length } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

module.exports = { getWeeklySummary };
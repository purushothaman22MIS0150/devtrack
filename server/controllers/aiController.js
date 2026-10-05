const pool = require('../config/db');
require('dotenv').config();

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

// POST /projects/:projectId/ai-tasks   body: { goal?: string }
const suggestTasks = async (req, res) => {
  const { projectId } = req.params;
  const { goal } = req.body;

  try {
    // Make sure the project belongs to the logged-in user
    const proj = await pool.query(
      'SELECT title, description, deadline FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );
    if (proj.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const project = proj.rows[0];

    const prompt = `You are a project planning assistant for a developer task tracker.
Project title: ${project.title}
Project description: ${project.description || 'None'}
User's goal: ${goal || project.title}

Break this into 5 to 8 concrete, actionable tasks in a sensible order.
Return ONLY a JSON array. Each item must have exactly these keys:
- "title": short task name (max 80 characters)
- "description": one sentence explaining the task
- "priority": one of "Low", "Medium", "High"
- "daysFromNow": integer between 1 and 30, the suggested deadline counted from today`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error ${response.status}: ${errorText}`);
      return res.status(502).json({ message: 'AI service failed. Try again.' });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('Could not parse Gemini output:', text);
      return res.status(502).json({ message: 'AI returned an unreadable answer. Try again.' });
    }

    if (!Array.isArray(parsed)) {
      return res.status(502).json({ message: 'AI returned an unexpected format. Try again.' });
    }

    const tasks = parsed.slice(0, 10).map(t => ({
      title: String(t.title || '').slice(0, 100),
      description: String(t.description || ''),
      priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
      deadline: addDays(Math.min(Math.max(parseInt(t.daysFromNow, 10) || 7, 1), 30)),
    })).filter(t => t.title);

    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { suggestTasks };
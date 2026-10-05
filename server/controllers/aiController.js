const pool = require('../config/db');
require('dotenv').config();

const MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
const urlFor = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const RETRY_STATUSES = [429, 500, 503, 504];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Tries each model; retries busy ones once before moving on
const callGemini = async (prompt) => {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(urlFor(model), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (response.ok) return await response.json();

        const errorText = await response.text();
        console.error(`Gemini ${model} error ${response.status}: ${errorText}`);

        if (!RETRY_STATUSES.includes(response.status)) break; // try next model
        await sleep(1500);
      } catch (e) {
        console.error(`Gemini ${model} request failed:`, e.message);
        await sleep(1000);
      }
    }
  }
  return null;
};

// POST /projects/:projectId/ai-tasks   body: { goal?: string }
const suggestTasks = async (req, res) => {
  const { projectId } = req.params;
  const { goal } = req.body;

  try {
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

    const data = await callGemini(prompt);
    if (!data) {
      return res.status(502).json({ message: 'AI is busy right now. Try again in a minute.' });
    }

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
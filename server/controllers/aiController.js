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

// GET /api/ai/weekly-summary
const weeklySummary = async (req, res) => {
  try {
    const tasks = await pool.query(
      `SELECT t.title, t.status, t.priority, t.deadline
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    const prompt = `You are a productivity coach. Here are a developer's tasks as JSON:
${JSON.stringify(tasks.rows)}

Write a short weekly summary in 4 to 5 sentences covering progress, overdue or high-priority items, and one tip for next week.
Return ONLY JSON like {"summary": "your text"}`;

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

    res.json({ summary: parsed.summary || clean });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/ai/priorities
const priorityAdvice = async (req, res) => {
  try {
    const tasks = await pool.query(
      `SELECT t.title, t.status, t.priority, t.deadline, p.title AS project
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    const today = new Date().toISOString().split('T')[0];
    const prompt = `You are a productivity coach. Today is ${today}.
Here are a developer's tasks as JSON:
${JSON.stringify(tasks.rows)}

Ignore completed tasks. Pick the 3 most important tasks to do first, considering deadlines and priority.
Return ONLY JSON like:
{"top": [{"title": "task title", "project": "project name", "reason": "one short sentence"}]}`;

    const data = await callGemini(prompt);
    if (!data) {
      return res.status(502).json({ message: 'AI is busy right now. Try again in a minute.' });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json({ top: Array.isArray(parsed.top) ? parsed.top.slice(0, 3) : [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Shared helpers for the AI hub ----------
const getUserTasks = async (userId) => {
  const r = await pool.query(
    `SELECT t.title, t.status, t.priority, t.deadline, p.title AS project
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE p.user_id = $1`,
    [userId]
  );
  return r.rows;
};

// Time logs are sent by the client (it already loads them from /timelogs)
const cleanLogs = (logs) =>
  Array.isArray(logs)
    ? logs.slice(0, 100).map(l => ({
        task: l.task_title,
        project: l.project_title,
        date: String(l.log_date || '').slice(0, 10),
        hours: parseFloat(l.hours) || 0,
      }))
    : [];

// Calls Gemini and returns parsed JSON, or sends an error and returns null
const askJson = async (res, prompt) => {
  const data = await callGemini(prompt);
  if (!data) {
    res.status(502).json({ message: 'AI is busy right now. Try again in a minute.' });
    return null;
  }
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error('Could not parse Gemini output:', text);
    res.status(502).json({ message: 'AI returned an unreadable answer. Try again.' });
    return null;
  }
};

const todayInfo = () => {
  const now = new Date();
  return `${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${now.toISOString().split('T')[0]}`;
};

// POST /api/ai/chat   body: { question, logs }
const chat = async (req, res) => {
  const question = String(req.body.question || '').trim().slice(0, 500);
  if (!question) return res.status(400).json({ message: 'Please type a question' });

  try {
    const tasks = await getUserTasks(req.user.id);
    const logs = cleanLogs(req.body.logs);

    const prompt = `You are DevTrack's assistant. Today is ${todayInfo()}.
Answer the user's question using ONLY the data below. If the data does not contain the answer, say so.
Keep the answer under 4 sentences.

TASKS: ${JSON.stringify(tasks)}
TIME LOGS: ${JSON.stringify(logs)}

QUESTION: ${question}

Return ONLY JSON like {"answer": "your answer"}`;

    const parsed = await askJson(res, prompt);
    if (!parsed) return;
    res.json({ answer: String(parsed.answer || 'Sorry, I could not find an answer.') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/ai/standup   body: { logs }
const standup = async (req, res) => {
  try {
    const tasks = await getUserTasks(req.user.id);
    const logs = cleanLogs(req.body.logs);

    const prompt = `You write short daily standup updates for a developer. Today is ${todayInfo()}.
Use the data below.
- "yesterday": what was worked on yesterday (or the most recent work day), based on time logs and completed tasks
- "today": what to work on today, based on tasks that are In Progress or To Do with the nearest deadlines
- "blockers": overdue tasks or risks, or "None"

TASKS: ${JSON.stringify(tasks)}
TIME LOGS: ${JSON.stringify(logs)}

Each value must be 1 to 3 short sentences.
Return ONLY JSON like {"yesterday": "...", "today": "...", "blockers": "..."}`;

    const parsed = await askJson(res, prompt);
    if (!parsed) return;
    res.json({
      yesterday: String(parsed.yesterday || ''),
      today: String(parsed.today || ''),
      blockers: String(parsed.blockers || 'None'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/ai/planner   body: { logs }
const planner = async (req, res) => {
  try {
    const tasks = await getUserTasks(req.user.id);
    const logs = cleanLogs(req.body.logs);

    const prompt = `You are a planning assistant for a developer. Today is ${todayInfo()}.
Build a plan for the next 5 working days starting today.
Rules: skip tasks with status Done, schedule tasks with the nearest deadlines and High priority first, and keep each day realistic (2 to 4 tasks). Use the time logs to judge how many hours the developer usually works per day.

TASKS: ${JSON.stringify(tasks)}
TIME LOGS: ${JSON.stringify(logs)}

Return ONLY JSON like:
{"plan": [{"day": "Monday", "focus": "one short sentence", "tasks": ["task title", "task title"]}]}`;

    const parsed = await askJson(res, prompt);
    if (!parsed) return;
    const plan = Array.isArray(parsed.plan)
      ? parsed.plan.slice(0, 7).map(d => ({
          day: String(d.day || ''),
          focus: String(d.focus || ''),
          tasks: Array.isArray(d.tasks) ? d.tasks.map(String).slice(0, 6) : [],
        }))
      : [];
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/ai/insights   body: { logs }
const insights = async (req, res) => {
  try {
    const logs = cleanLogs(req.body.logs);
    if (logs.length === 0) {
      return res.json({ insights: ['No time logs yet. Log some work and try again.'] });
    }

    const prompt = `You are a productivity analyst. Today is ${todayInfo()}.
Analyze these time logs and give 4 short insights: which project takes the most hours, which weekdays have the most work, any long gaps with no work, and one practical suggestion.
Each insight must be one sentence and mention real numbers from the data.

TIME LOGS: ${JSON.stringify(logs)}

Return ONLY JSON like {"insights": ["...", "...", "...", "..."]}`;

    const parsed = await askJson(res, prompt);
    if (!parsed) return;
    res.json({
      insights: Array.isArray(parsed.insights) ? parsed.insights.map(String).slice(0, 6) : [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { suggestTasks, weeklySummary, priorityAdvice, chat, standup, planner, insights };
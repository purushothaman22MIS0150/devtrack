const pool = require('../config/db');

const search = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    return res.json({ projects: [], tasks: [] });
  }
  const term = `%${q}%`;
  try {
    const projects = await pool.query(
      `SELECT id, title, description, status
       FROM projects
       WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id, term]
    );
    const tasks = await pool.query(
      `SELECT t.id, t.title, t.description, t.status, t.project_id, p.title AS project_title
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1 AND (t.title ILIKE $2 OR t.description ILIKE $2)
       LIMIT 20`,
      [req.user.id, term]
    );
    res.json({ projects: projects.rows, tasks: tasks.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { search };
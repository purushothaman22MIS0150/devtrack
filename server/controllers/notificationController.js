const pool = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.title, t.deadline, t.project_id, p.title AS project_title
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1
       AND t.status != 'Done'
       AND t.deadline IS NOT NULL
       AND t.deadline <= CURRENT_DATE + INTERVAL '2 days'
       ORDER BY t.deadline ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications };
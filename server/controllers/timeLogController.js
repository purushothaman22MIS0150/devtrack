const pool = require('../config/db');

// Get all time logs for a user
const getTimeLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tl.*, t.title as task_title, p.title as project_title 
       FROM time_logs tl
       JOIN tasks t ON tl.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       WHERE tl.user_id = $1
       ORDER BY tl.log_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a time log
const createTimeLog = async (req, res) => {
  const { task_id, hours, log_date, note } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO time_logs (task_id, user_id, hours, log_date, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [task_id, req.user.id, hours, log_date, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a time log
const deleteTimeLog = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM time_logs WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    res.json({ message: 'Time log deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTimeLogs, createTimeLog, deleteTimeLog };
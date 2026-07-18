const pool = require('../config/db');

// Get all tasks for a project
const getTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a task
const createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, priority, deadline } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (project_id, title, description, priority, deadline) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [projectId, title, description, priority, deadline]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a task
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, deadline } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title=$1, description=$2, priority=$3, status=$4, deadline=$5 WHERE id=$6 RETURNING *',
      [title, description, priority, status, deadline, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
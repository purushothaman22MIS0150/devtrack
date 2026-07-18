const pool = require('../config/db');

// Get all projects for logged in user
const getProjects = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a project
const createProject = async (req, res) => {
  const { title, description, deadline } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (user_id, title, description, deadline) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, description, deadline]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a project
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, deadline } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET title=$1, description=$2, status=$3, deadline=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [title, description, status, deadline, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { suggestTasks } = require('../controllers/aiController');

router.get('/:projectId/tasks', auth, getTasks);
router.post('/:projectId/tasks', auth, createTask);
router.post('/:projectId/ai-tasks', auth, suggestTasks);
router.put('/tasks/:id', auth, updateTask);
router.delete('/tasks/:id', auth, deleteTask);

module.exports = router;
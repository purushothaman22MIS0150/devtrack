const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { weeklySummary, priorityAdvice, parseTask } = require('../controllers/aiController');
router.get('/priorities', auth, priorityAdvice);
router.post('/parse-task', auth, parseTask);
router.get('/weekly-summary', auth, weeklySummary);

module.exports = router;
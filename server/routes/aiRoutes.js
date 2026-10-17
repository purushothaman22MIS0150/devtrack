const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  weeklySummary,
  priorityAdvice,
  chat,
  standup,
  planner,
  insights,
} = require('../controllers/aiController');

router.get('/weekly-summary', auth, weeklySummary);
router.get('/priorities', auth, priorityAdvice);
router.post('/chat', auth, chat);
router.post('/standup', auth, standup);
router.post('/planner', auth, planner);
router.post('/insights', auth, insights);

module.exports = router;
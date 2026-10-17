const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { weeklySummary, priorityAdvice } = require('../controllers/aiController');
router.get('/priorities', auth, priorityAdvice);
router.get('/weekly-summary', auth, weeklySummary);

module.exports = router;
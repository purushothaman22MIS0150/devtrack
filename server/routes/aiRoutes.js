const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWeeklySummary } = require('../controllers/aiController');

router.get('/weekly-summary', auth, getWeeklySummary);

module.exports = router;
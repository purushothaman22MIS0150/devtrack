const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { weeklySummary } = require('../controllers/aiController');

router.get('/weekly-summary', auth, weeklySummary);

module.exports = router;
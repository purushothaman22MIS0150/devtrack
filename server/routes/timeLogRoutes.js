const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTimeLogs,
  createTimeLog,
  deleteTimeLog
} = require('../controllers/timeLogController');

router.get('/', auth, getTimeLogs);
router.post('/', auth, createTimeLog);
router.delete('/:id', auth, deleteTimeLog);

module.exports = router;
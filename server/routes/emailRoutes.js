const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendTestEmail } = require('../controllers/emailController');

router.post('/test', auth, sendTestEmail);

module.exports = router;
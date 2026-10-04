const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, updateProfile, changePassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);

module.exports = router;
const express = require('express');
const { login, logout, register, me } = require('../../controllers/api/auth.controller');
const { requireAuth, protect } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { registerRules, loginRules } = require('../../validators/auth.validator');

const router = express.Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', requireAuth, logout);
router.get('/me', protect, me);

module.exports = router;

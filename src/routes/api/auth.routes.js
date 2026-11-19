const express = require('express');
const { login, logout, register } = require('../../controllers/api/auth.controller');
const { requireAuth } = require('../../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);

module.exports = router;

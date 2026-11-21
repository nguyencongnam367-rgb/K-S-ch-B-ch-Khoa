const router = require('express').Router();

// Gom tất cả route API, gắn tại /api/v1 trong app.js
router.use('/auth', require('./auth.routes'));
router.use('/categories', require('./category.routes'));
router.use('/authors', require('./author.routes'));
router.use('/books', require('./book.routes'));
router.use('/loans', require('./loan.routes'));
router.use('/users', require('./user.routes'));
router.use('/stats', require('./stats.routes'));

module.exports = router;

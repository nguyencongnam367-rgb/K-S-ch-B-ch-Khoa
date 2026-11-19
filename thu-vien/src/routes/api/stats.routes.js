const router = require('express').Router();
const ctrl = require('../../controllers/api/stats.controller');
const { protect, authorize } = require('../../middlewares/auth');

router.use(protect, authorize('admin'));

router.get('/summary', ctrl.summary);
router.get('/top-books', ctrl.topBooks);

module.exports = router;

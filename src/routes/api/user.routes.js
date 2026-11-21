const router = require('express').Router();
const ctrl = require('../../controllers/api/user.controller');
const { protect, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

router.use(protect, authorize('admin'));

router.get('/', ctrl.list);
router.get('/:id', validate.idParam, validate, ctrl.getOne);
router.patch('/:id', validate.idParam, validate, ctrl.update);
router.delete('/:id', validate.idParam, validate, ctrl.remove);

module.exports = router;

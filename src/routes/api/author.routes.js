const router = require('express').Router();
const ctrl = require('../../controllers/api/author.controller');
const { protect, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { authorRules } = require('../../validators/taxonomy.validator');

router.get('/', ctrl.list);
router.get('/:id', validate.idParam, validate, ctrl.getOne);
router.post('/', protect, authorize('admin'), authorRules, validate, ctrl.create);
router.put('/:id', protect, authorize('admin'), validate.idParam, authorRules, validate, ctrl.update);
router.delete('/:id', protect, authorize('admin'), validate.idParam, validate, ctrl.remove);

module.exports = router;

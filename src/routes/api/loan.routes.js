const router = require('express').Router();
const ctrl = require('../../controllers/api/loan.controller');
const { protect, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { createLoanRules, borrowMyRules, returnMyRules } = require('../../validators/loan.validator');

router.use(protect); // mọi API phiếu mượn đều cần đăng nhập

router.get('/my', ctrl.my); // độc giả xem lịch sử của mình
router.post('/my', borrowMyRules, validate, ctrl.borrowMy);
router.patch('/my/:id/return', validate.idParam, returnMyRules, validate, ctrl.returnMyBook);
router.get('/overdue', authorize('admin'), ctrl.overdue);
router.post('/remind-overdue', authorize('admin'), ctrl.remindAll);
router.get('/code/:code', authorize('admin'), ctrl.byCode);

router.get('/', authorize('admin'), ctrl.list);
router.post('/', authorize('admin'), createLoanRules, validate, ctrl.create);
router.get('/:id', validate.idParam, validate, ctrl.getOne);
router.patch('/:id/return', authorize('admin'), validate.idParam, validate, ctrl.returnLoan);
router.post('/:id/remind', authorize('admin'), validate.idParam, validate, ctrl.remind);

module.exports = router;

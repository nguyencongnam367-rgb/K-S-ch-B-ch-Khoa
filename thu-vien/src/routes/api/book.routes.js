const router = require('express').Router();
const ctrl = require('../../controllers/api/book.controller');
const { protect, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const uploadCover = require('../../middlewares/upload');
const { createBookRules, updateBookRules } = require('../../validators/book.validator');

router.get('/', ctrl.list); // ?q=&category=&author=&publisher=&language=&available=true&sort=&page=&limit=
router.get('/:id', validate.idParam, validate, ctrl.getOne);
// upload chạy trước để multer đọc xong body (multipart) rồi mới kiểm tra dữ liệu
router.post('/', protect, authorize('admin'), uploadCover, createBookRules, validate, ctrl.create);
router.put('/:id', protect, authorize('admin'), uploadCover, validate.idParam, updateBookRules, validate, ctrl.update);
router.delete('/:id', protect, authorize('admin'), validate.idParam, validate, ctrl.remove);

module.exports = router;

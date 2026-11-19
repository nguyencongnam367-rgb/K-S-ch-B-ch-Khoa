const { body } = require('express-validator');

const bytes = (value) => Buffer.byteLength(String(value), 'utf8');
const passwordMessage = 'Mật khẩu cần có ít nhất 6 ký tự và tối đa 72 byte.';

exports.registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Họ tên cần có từ 2 đến 80 ký tự.'),
  body('email').isString().trim().isLength({ max: 254 }).isEmail().withMessage('Vui lòng nhập email hợp lệ.'),
  body('password').isString().withMessage(passwordMessage).bail()
    .isLength({ min: 6 }).withMessage(passwordMessage).bail()
    .custom((value) => bytes(value) <= 72).withMessage(passwordMessage),
  body('confirmPassword').optional({ values: 'null' })
    .custom((value, { req }) => value === req.body.password).withMessage('Mật khẩu nhập lại chưa khớp.'),
  body('readerType').optional().isIn(['student', 'lecturer']).withMessage('Loại độc giả không hợp lệ.')
];

exports.loginRules = [
  body('email').isString().trim().isEmail().withMessage('Vui lòng kiểm tra email và mật khẩu.'),
  body('password').isString().custom((value) => value.length > 0 && bytes(value) <= 72).withMessage('Vui lòng kiểm tra email và mật khẩu.')
];

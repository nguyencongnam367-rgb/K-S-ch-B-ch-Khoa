const { body } = require('express-validator');

const isbnPattern = /^[0-9Xx][0-9Xx -]{7,19}$/;
const optional = { values: 'falsy' }; // bỏ qua chuỗi rỗng (biểu mẫu multipart gửi '' khi để trống)

const optionalFields = [
  body('totalCopies').optional(optional).isInt({ min: 0 }).withMessage('Tổng số bản là số nguyên không âm').toInt(),
  body('price').optional(optional).isFloat({ min: 0 }).withMessage('Giá phải là số không âm').toFloat(),
  body('year').optional(optional).isInt({ min: 1000, max: 3000 }).withMessage('Năm xuất bản không hợp lệ').toInt(),
  body('pages').optional(optional).isInt({ min: 1 }).withMessage('Số trang không hợp lệ').toInt(),
  body('language').optional(optional).isIn(['vi', 'en', 'other']).withMessage('Ngôn ngữ không hợp lệ')
];

exports.createBookRules = [
  body('title').isString().trim().notEmpty().withMessage('Tên sách là bắt buộc').isLength({ max: 200 }).withMessage('Tên sách tối đa 200 ký tự'),
  body('isbn').isString().trim().matches(isbnPattern).withMessage('ISBN không hợp lệ'),
  body('author').isMongoId().withMessage('Tác giả không hợp lệ'),
  body('category').isMongoId().withMessage('Thể loại không hợp lệ'),
  ...optionalFields
];

exports.updateBookRules = [
  body('title').optional().isString().trim().notEmpty().withMessage('Tên sách không được rỗng').isLength({ max: 200 }).withMessage('Tên sách tối đa 200 ký tự'),
  body('isbn').optional().isString().trim().matches(isbnPattern).withMessage('ISBN không hợp lệ'),
  body('author').optional().isMongoId().withMessage('Tác giả không hợp lệ'),
  body('category').optional().isMongoId().withMessage('Thể loại không hợp lệ'),
  ...optionalFields
];

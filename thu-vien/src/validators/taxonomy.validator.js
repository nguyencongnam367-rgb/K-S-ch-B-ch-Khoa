const { body } = require('express-validator');

// Thể loại dùng trường description, tác giả dùng trường bio
const rulesFor = (descField) => [
  body('name').isString().trim().notEmpty().withMessage('Tên không được rỗng').isLength({ max: 100 }).withMessage('Tên tối đa 100 ký tự'),
  body(descField).optional({ values: 'null' }).isString().trim().isLength({ max: 300 }).withMessage('Mô tả tối đa 300 ký tự')
];

exports.categoryRules = rulesFor('description');
exports.authorRules = rulesFor('bio');

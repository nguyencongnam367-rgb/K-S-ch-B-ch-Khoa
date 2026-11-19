const { validationResult, param } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Gom lỗi của express-validator thành một ApiError 400
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(new ApiError(400, errors[0].message, errors));
}

validate.idParam = [param('id').isMongoId().withMessage('Mã không hợp lệ')];

module.exports = validate;

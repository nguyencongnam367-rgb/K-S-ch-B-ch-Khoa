const { body } = require('express-validator');
const { LOAN_LIMIT_PER_READER } = require('../config/constants');

exports.createLoanRules = [
  body('readerId').isMongoId().withMessage('Độc giả không hợp lệ'),
  body('bookIds').isArray({ min: 1, max: LOAN_LIMIT_PER_READER }).withMessage(`Mỗi phiếu mượn từ 1 đến ${LOAN_LIMIT_PER_READER} sách`),
  body('bookIds.*').isMongoId().withMessage('Mã sách không hợp lệ')
];

exports.borrowMyRules = [
  body('bookId').isMongoId().withMessage('Mã sách không hợp lệ')
];

exports.returnMyRules = [
  body('bookId').isMongoId().withMessage('Mã sách không hợp lệ')
];

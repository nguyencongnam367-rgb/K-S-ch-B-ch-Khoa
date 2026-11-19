const loanService = require('../../services/loan.service');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');

// Thủ thư: xem mọi phiếu (lọc theo status, q, reader)
const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await loanService.listLoans(req.query);
  res.json({ success: true, data, pagination });
});

// Độc giả: lịch sử mượn của chính mình
const my = asyncHandler(async (req, res) => {
  const { data, pagination } = await loanService.listLoans(req.query, { reader: req.user.id });
  res.json({ success: true, data, pagination });
});

const borrowMy = asyncHandler(async (req, res) => {
  if (req.user.role !== 'user') throw new ApiError(403, 'Chỉ độc giả mới có thể tự mượn sách');
  if (await loanService.getActiveLoanForBook(req.user.id, req.body.bookId)) {
    throw new ApiError(409, 'Bạn đang mượn cuốn sách này');
  }

  const { loan, warnings } = await loanService.issueLoan({
    readerId: req.user.id,
    bookIds: [req.body.bookId],
    issuedBy: req.user.id
  });
  res.status(201).json({ success: true, data: loan, warnings });
});

const returnMyBook = asyncHandler(async (req, res) => {
  if (req.user.role !== 'user') throw new ApiError(403, 'Chỉ độc giả mới có thể tự trả sách');
  const loan = await loanService.returnBook(req.params.id, req.body.bookId, req.user.id);
  res.json({ success: true, data: loan, message: 'Đã trả sách' });
});

const overdue = asyncHandler(async (req, res) => {
  const { data, pagination } = await loanService.listLoans({ sort: 'dueDate', ...req.query, status: 'overdue' });
  res.json({ success: true, data, pagination });
});

const getOne = asyncHandler(async (req, res) => {
  const loan = await loanService.getLoanById(req.params.id);
  if (req.user.role !== 'admin' && loan.reader.id !== req.user.id) throw new ApiError(403, 'Bạn không có quyền xem phiếu này');
  res.json({ success: true, data: loan });
});

const byCode = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await loanService.getLoanByCode(req.params.code) });
});

// Hạn trả, giá sách, mã phiếu đều do server tính, không nhận từ client
const create = asyncHandler(async (req, res) => {
  const { readerId, bookIds } = req.body;
  const { loan, warnings } = await loanService.issueLoan({ readerId, bookIds, issuedBy: req.user.id });
  res.status(201).json({ success: true, data: loan, warnings });
});

const returnLoan = asyncHandler(async (req, res) => {
  const loan = await loanService.returnLoan(req.params.id);
  res.json({ success: true, data: loan, message: loan.fine ? `Đã trả sách, tiền phạt ${loan.fine.toLocaleString('vi-VN')}đ` : 'Đã trả sách' });
});

const remind = asyncHandler(async (req, res) => {
  const result = await loanService.remindLoan(req.params.id);
  res.json({ success: true, message: result.delivered ? 'Đã gửi email nhắc' : 'Đã ghi nhận nhắc (chưa cấu hình SMTP nên chưa gửi email thật)', data: result });
});

const remindAll = asyncHandler(async (req, res) => {
  const sent = await loanService.remindAllOverdue();
  res.json({ success: true, message: `Đã nhắc ${sent} phiếu quá hạn`, data: { sent } });
});

module.exports = { list, my, borrowMy, returnMyBook, overdue, getOne, byCode, create, returnLoan, remind, remindAll };

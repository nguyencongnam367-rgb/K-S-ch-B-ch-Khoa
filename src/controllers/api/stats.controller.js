const loanService = require('../../services/loan.service');
const asyncHandler = require('../../utils/asyncHandler');

const summary = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await loanService.summaryStats() });
});

// ?month=2026-10&limit=5
const topBooks = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
  res.json({ success: true, data: await loanService.topBorrowedBooks({ month: req.query.month, limit }) });
});

module.exports = { summary, topBooks };

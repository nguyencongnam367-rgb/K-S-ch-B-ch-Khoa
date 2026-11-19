const { FINE_PER_DAY, FINE_VALUE_RATE } = require('../config/constants');

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Số ngày từ mốc "from" đến "to" tính theo ngày lịch (có thể âm)
function dayDiff(to, from) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY);
}

function daysOverdue(dueDate, now = new Date()) {
  return Math.max(0, dayDiff(now, dueDate));
}

function daysLeft(dueDate, now = new Date()) {
  return Math.max(0, dayDiff(dueDate, now));
}

// Tiền phạt = số ngày quá hạn x mức phạt/ngày x số cuốn + hệ số theo giá trị sách.
// Tiền phạt không vượt quá tổng giá trị sách (nếu sách có giá).
function calculateFine(loan, now = new Date()) {
  const days = daysOverdue(loan.dueDate, loan.returnDate || now);
  const items = loan.items || [];
  const itemCount = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.priceAtLoan || 0), 0);

  if (days === 0) {
    return { daysOverdue: 0, ratePerDay: FINE_PER_DAY, itemCount, valueFactor: 0, total: 0 };
  }

  const valueFactor = Math.round(totalValue * FINE_VALUE_RATE);
  let total = days * FINE_PER_DAY * itemCount + valueFactor;
  if (totalValue > 0) total = Math.min(total, totalValue);

  return { daysOverdue: days, ratePerDay: FINE_PER_DAY, itemCount, valueFactor, total };
}

module.exports = { startOfDay, addDays, dayDiff, daysOverdue, daysLeft, calculateFine };

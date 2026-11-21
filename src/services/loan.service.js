const mongoose = require('mongoose');
const Loan = require('../models/loan.model');
const Book = require('../models/book.model');
const User = require('../models/user.model');
const Counter = require('../models/counter.model');
const ApiError = require('../utils/ApiError');
const { APIFeatures, escapeRegex } = require('../utils/apiFeatures');
const fineService = require('./fine.service');
const mailService = require('./mail.service');
const { LOAN_LIMIT_PER_READER, LOAN_DAYS, REMIND_BEFORE_DAYS } = require('../config/constants');

const ACTIVE = ['borrowing', 'overdue'];
const { startOfDay, addDays } = fineService;

const LOAN_POPULATE = [
  { path: 'reader', select: 'name email readerCode' },
  { path: 'items.book', select: 'title cover isbn' }
];

// Chuyển phiếu quá hạn: trạng thái borrowing mà hạn trả đã qua -> overdue
async function markOverdue(now = new Date()) {
  const result = await Loan.updateMany(
    { status: 'borrowing', dueDate: { $lt: startOfDay(now) } },
    { $set: { status: 'overdue' } }
  );
  return result.modifiedCount || 0;
}

// Số sách đang giữ và số phiếu quá hạn của từng độc giả (đếm từ phiếu, không lưu cột riêng)
async function holdingMap(readerIds) {
  const ids = readerIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const loans = await Loan.find({ reader: { $in: ids }, status: { $in: ACTIVE } }).select('reader items status').lean();
  const map = new Map();
  loans.forEach((loan) => {
    const key = String(loan.reader);
    const row = map.get(key) || { holding: 0, overdue: 0 };
    row.holding += loan.items.filter((item) => !item.returnDate).length;
    if (loan.status === 'overdue') row.overdue += 1;
    map.set(key, row);
  });
  return map;
}

// Dữ liệu trả ra API / giao diện: có tiền phạt tính ngay từ máy chủ
function toDto(loan, now = new Date()) {
  const obj = loan.toObject ? loan.toObject() : loan;
  const returned = obj.status === 'returned';
  const tracksItemReturns = obj.items.some((item) => item.returnDate);
  const detail = fineService.calculateFine(obj, returned ? obj.returnDate : now);
  const itemDetails = obj.items.map((item) => {
    const itemReturnDate = item.returnDate || (returned ? obj.returnDate : undefined);
    const itemDetail = fineService.calculateFine(
      { dueDate: obj.dueDate, items: [item] },
      itemReturnDate || now
    );
    return { item, itemReturnDate, detail: itemDetail };
  });
  const fine = tracksItemReturns
    ? itemDetails.reduce((sum, row) => sum + (row.item.returnDate ? row.item.fine : row.detail.total), 0)
    : (returned ? obj.fine : detail.total);
  const fineDetail = tracksItemReturns
    ? {
      daysOverdue: returned ? 0 : Math.max(0, ...itemDetails
        .filter((row) => !row.itemReturnDate)
        .map((row) => row.detail.daysOverdue)),
      ratePerDay: detail.ratePerDay,
      itemCount: obj.items.length,
      valueFactor: itemDetails.reduce((sum, row) => sum + row.detail.valueFactor, 0),
      total: fine
    }
    : detail;
  const reader = obj.reader && obj.reader.name
    ? { id: String(obj.reader._id), name: obj.reader.name, email: obj.reader.email, readerCode: obj.reader.readerCode }
    : { id: String(obj.reader) };

  return {
    id: String(obj._id),
    code: obj.code,
    reader,
    items: obj.items.map((item, index) => ({
      book: item.book && item.book.title
        ? { id: String(item.book._id), title: item.book.title, cover: item.book.cover, isbn: item.book.isbn }
        : {
          id: item.bookId || String(item.book),
          title: item.bookTitle || 'Sách đã xóa',
          cover: '',
          isbn: item.bookIsbn || ''
        },
      priceAtLoan: item.priceAtLoan,
      returned: Boolean(itemDetails[index].itemReturnDate),
      returnDate: itemDetails[index].itemReturnDate
    })),
    borrowDate: obj.borrowDate,
    dueDate: obj.dueDate,
    returnDate: obj.returnDate,
    status: obj.status,
    daysOverdue: returned ? 0 : fineDetail.daysOverdue,
    daysLeft: returned ? 0 : fineService.daysLeft(obj.dueDate, now),
    fine,
    fineDetail
  };
}

async function loadLoan(filter) {
  const loan = await Loan.findOne(filter).populate(LOAN_POPULATE);
  if (!loan) throw new ApiError(404, 'Không tìm thấy phiếu mượn');
  return loan;
}

// Lập phiếu mượn: kiểm tra độc giả, giới hạn số sách, trừ số bản còn bằng thao tác nguyên tử
async function issueLoan({ readerId, bookIds, issuedBy }) {
  const ids = bookIds.map(String);
  if (new Set(ids).size !== ids.length) throw new ApiError(400, 'Một cuốn sách chỉ được chọn một lần trong phiếu');

  const reader = await User.findById(readerId);
  if (!reader || reader.role !== 'user') throw new ApiError(404, 'Không tìm thấy độc giả');
  if (!reader.isActive) throw new ApiError(403, 'Tài khoản độc giả đã bị khóa');

  await markOverdue();
  const status = (await holdingMap([reader._id])).get(String(reader._id)) || { holding: 0, overdue: 0 };
  if (status.holding + ids.length > LOAN_LIMIT_PER_READER) {
    throw new ApiError(409, `Độc giả đang giữ ${status.holding} sách, mỗi người chỉ được giữ tối đa ${LOAN_LIMIT_PER_READER} sách`);
  }

  const reserved = [];
  try {
    for (const id of ids) {
      // Chỉ trừ khi còn ít nhất 1 bản: hai người cùng mượn cuốn cuối thì chỉ một người thành công
      const book = await Book.findOneAndUpdate(
        { _id: id, availableCopies: { $gte: 1 } },
        { $inc: { availableCopies: -1 } },
        { returnDocument: 'after' }
      );
      if (!book) {
        const exists = await Book.findById(id).select('title');
        throw exists ? new ApiError(409, `Sách "${exists.title}" đã hết bản`) : new ApiError(404, 'Không tìm thấy sách');
      }
      reserved.push(book);
    }

    const now = new Date();
    const seq = await Counter.next('loan');
    const loan = await Loan.create({
      code: `LM-${String(seq).padStart(4, '0')}`,
      reader: reader._id,
      items: reserved.map((book) => ({
        book: book._id,
        bookId: String(book._id),
        bookTitle: book.title,
        bookIsbn: book.isbn,
        priceAtLoan: book.price
      })),
      borrowDate: now,
      dueDate: addDays(now, LOAN_DAYS),
      issuedBy
    });

    const full = await loadLoan({ _id: loan._id });
    const warnings = status.overdue ? [`Độc giả đang có ${status.overdue} phiếu quá hạn`] : [];
    return { loan: toDto(full), warnings };
  } catch (error) {
    // Hoàn lại số bản đã trừ nếu có lỗi giữa chừng
    await Promise.all(reserved.map((book) => Book.updateOne({ _id: book._id }, { $inc: { availableCopies: 1 } })));
    throw error;
  }
}

// Độc giả trả riêng một sách; các sách khác trong cùng phiếu vẫn được giữ
async function returnBook(loanId, bookId, readerId) {
  await markOverdue();
  const loan = await Loan.findOne({ _id: loanId, reader: readerId }).select('status dueDate items').lean();
  if (!loan) throw new ApiError(404, 'Không tìm thấy phiếu mượn');

  const item = loan.items.find((entry) => String(entry.book) === String(bookId));
  if (!item) throw new ApiError(404, 'Sách không thuộc phiếu mượn này');
  if (item.returnDate || !ACTIVE.includes(loan.status)) {
    throw new ApiError(409, 'Sách này đã được trả');
  }

  const now = new Date();
  const fine = fineService.calculateFine({ dueDate: loan.dueDate, items: [item] }, now);
  const claimed = await Loan.findOneAndUpdate(
    {
      _id: loanId,
      reader: readerId,
      status: { $in: ACTIVE },
      items: { $elemMatch: { book: bookId, returnDate: { $exists: false } } }
    },
    {
      $set: { 'items.$[item].returnDate': now, 'items.$[item].fine': fine.total },
      $inc: { fine: fine.total }
    },
    {
      arrayFilters: [{ 'item.book': bookId, 'item.returnDate': { $exists: false } }],
      returnDocument: 'after'
    }
  );

  if (!claimed) throw new ApiError(409, 'Sách này đã được trả');

  const stockUpdate = await Book.updateOne({ _id: bookId }, { $inc: { availableCopies: 1 } });
  if (stockUpdate.matchedCount !== 1) throw new ApiError(404, 'Không tìm thấy sách trong kho');

  if (claimed.items.every((entry) => entry.returnDate)) {
    await Loan.updateOne(
      { _id: loanId, reader: readerId, status: { $in: ACTIVE } },
      { $set: { status: 'returned', returnDate: now } }
    );
  }

  return toDto(await loadLoan({ _id: loanId }), now);
}

// Trả toàn bộ phiếu (thao tác thủ thư), cộng lại số bản chưa được trả trước đó
async function returnLoan(id) {
  const now = new Date();
  const claimed = await Loan.findOneAndUpdate(
    { _id: id, status: { $in: ACTIVE } },
    { $set: { status: 'returned', returnDate: now } },
    { returnDocument: 'after' }
  );

  if (!claimed) {
    const exists = await Loan.exists({ _id: id });
    throw exists ? new ApiError(409, 'Phiếu này đã được trả') : new ApiError(404, 'Không tìm thấy phiếu mượn');
  }

  const previouslyReturned = claimed.items.some((item) => item.returnDate);
  const toRestock = claimed.items.filter((item) => !item.returnDate);
  if (previouslyReturned) {
    toRestock.forEach((item) => {
      item.returnDate = now;
      item.fine = fineService.calculateFine({ dueDate: claimed.dueDate, items: [item] }, now).total;
    });
    claimed.fine = claimed.items.reduce((sum, item) => sum + (item.fine || 0), 0);
  } else {
    claimed.fine = fineService.calculateFine(claimed, now).total;
  }
  await claimed.save();
  await Promise.all(toRestock.map((item) => Book.updateOne({ _id: item.book }, { $inc: { availableCopies: 1 } })));

  return toDto(await loadLoan({ _id: id }), now);
}

function getLoanById(id) {
  return loadLoan({ _id: id }).then((loan) => toDto(loan));
}

async function getActiveLoanForBook(readerId, bookId) {
  const loan = await Loan.findOne({
    reader: readerId,
    status: { $in: ACTIVE },
    items: { $elemMatch: { book: bookId, returnDate: { $exists: false } } }
  }).sort({ borrowDate: 1 }).select('_id').lean();
  return loan ? String(loan._id) : null;
}

async function getLoanByCode(code) {
  await markOverdue();
  const loan = await loadLoan({ code: String(code).trim().toUpperCase() });
  return toDto(loan);
}

// Danh sách phiếu: lọc theo status (active | borrowing | overdue | returned), q (mã phiếu, tên độc giả)
async function listLoans(queryString, extraFilter = {}) {
  await markOverdue();
  const filter = { ...extraFilter };
  const { status } = queryString;

  if (status === 'active') filter.status = { $in: ACTIVE };
  else if (['borrowing', 'overdue', 'returned'].includes(status)) filter.status = status;

  const q = String(queryString.q || '').trim();
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    const readers = await User.find({ $or: [{ name: regex }, { email: regex }, { readerCode: regex }] }).select('_id').lean();
    filter.$or = [{ code: regex }, { reader: { $in: readers.map((r) => r._id) } }];
  }
  if (queryString.reader && !extraFilter.reader) filter.reader = queryString.reader;

  const features = new APIFeatures(Loan, queryString, filter).sort(['createdAt', 'dueDate', 'borrowDate', 'fine'], '-createdAt');
  const { data, pagination } = await features.exec({ populate: LOAN_POPULATE });
  const now = new Date();
  return { data: data.map((loan) => toDto(loan, now)), pagination };
}

async function countByStatus() {
  const [active, overdue, returned, total] = await Promise.all([
    Loan.countDocuments({ status: { $in: ACTIVE } }),
    Loan.countDocuments({ status: 'overdue' }),
    Loan.countDocuments({ status: 'returned' }),
    Loan.countDocuments()
  ]);
  return { all: total, active, overdue, returned };
}

// ---- Nhắc hạn bằng email ----
async function deliverReminder(loan) {
  const dto = toDto(loan);
  if (loan.status === 'overdue') {
    const result = await mailService.sendOverdueReminder(loan, dto.fineDetail);
    loan.reminders.overdue = true;
    await loan.save();
    return result;
  }
  const result = await mailService.sendDueSoonReminder(loan);
  loan.reminders.dueSoon = true;
  await loan.save();
  return result;
}

async function remindLoan(id) {
  await markOverdue();
  const loan = await loadLoan({ _id: id });
  if (loan.status === 'returned') throw new ApiError(409, 'Phiếu này đã được trả, không cần nhắc');
  return deliverReminder(loan);
}

async function remindAllOverdue() {
  await markOverdue();
  const loans = await Loan.find({ status: 'overdue' }).populate(LOAN_POPULATE);
  let sent = 0;
  for (const loan of loans) {
    await deliverReminder(loan);
    sent += 1;
  }
  return sent;
}

// Dùng cho cron: nhắc trước hạn 2 ngày, và báo ngay khi quá hạn (mỗi phiếu một lần)
async function sendDueSoonReminders(now = new Date()) {
  const from = startOfDay(now);
  const to = addDays(startOfDay(now), REMIND_BEFORE_DAYS + 1);
  const loans = await Loan.find({ status: 'borrowing', 'reminders.dueSoon': false, dueDate: { $gte: from, $lt: to } }).populate(LOAN_POPULATE);
  for (const loan of loans) await deliverReminder(loan);
  return loans.length;
}

async function sendOverdueReminders() {
  const loans = await Loan.find({ status: 'overdue', 'reminders.overdue': false }).populate(LOAN_POPULATE);
  for (const loan of loans) await deliverReminder(loan);
  return loans.length;
}

// ---- Thống kê ----
async function summaryStats(now = new Date()) {
  await markOverdue(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [books, readers, counts, returnedThisMonth, overdueLoans] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ role: 'user' }),
    countByStatus(),
    Loan.find({ status: 'returned', returnDate: { $gte: monthStart } }).select('fine').lean(),
    Loan.find({ status: 'overdue' }).select('dueDate items fine').lean()
  ]);

  const collected = returnedThisMonth.reduce((sum, loan) => sum + (loan.fine || 0), 0);
  const accruing = overdueLoans.reduce((sum, loan) => {
    const activeItems = loan.items.filter((item) => !item.returnDate);
    return sum + (loan.fine || 0) + fineService.calculateFine({ dueDate: loan.dueDate, items: activeItems }, now).total;
  }, 0);

  return {
    books,
    readers,
    borrowing: counts.active,
    overdue: counts.overdue,
    fineThisMonth: collected + accruing
  };
}

// Tổng số phiếu quá hạn và tiền phạt tạm tính (cho trang Quá hạn)
async function overdueTotals(now = new Date()) {
  await markOverdue(now);
  const loans = await Loan.find({ status: 'overdue' }).select('dueDate items fine').lean();
  const totalFine = loans.reduce((sum, loan) => {
    const activeItems = loan.items.filter((item) => !item.returnDate);
    return sum + (loan.fine || 0) + fineService.calculateFine({ dueDate: loan.dueDate, items: activeItems }, now).total;
  }, 0);
  return { count: loans.length, totalFine };
}

// Sách được mượn nhiều nhất trong tháng (month = YYYY-MM)
async function topBorrowedBooks({ month, limit = 5 } = {}, now = new Date()) {
  const match = /^(\d{4})-(\d{2})$/.exec(month || '');
  const start = match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const loans = await Loan.find({ borrowDate: { $gte: start, $lt: end } }).select('items').lean();
  const counts = new Map();
  loans.forEach((loan) => loan.items.forEach((item) => {
    const key = String(item.book);
    counts.set(key, (counts.get(key) || 0) + 1);
  }));

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const books = await Book.find({ _id: { $in: top.map(([id]) => id) } }).select('title').lean();
  const titles = new Map(books.map((book) => [String(book._id), book.title]));
  return top.map(([id, count]) => ({ bookId: id, title: titles.get(id) || 'Sách đã xóa', count }));
}

module.exports = {
  ACTIVE,
  markOverdue,
  holdingMap,
  toDto,
  issueLoan,
  returnLoan,
  getLoanById,
  getLoanByCode,
  getActiveLoanForBook,
  listLoans,
  countByStatus,
  returnBook,
  remindLoan,
  remindAllOverdue,
  sendDueSoonReminders,
  sendOverdueReminders,
  summaryStats,
  overdueTotals,
  topBorrowedBooks
};

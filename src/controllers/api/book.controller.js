const Book = require('../../models/book.model');
const Loan = require('../../models/loan.model');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const bookService = require('../../services/book.service');
const loanService = require('../../services/loan.service');
const FIELDS = ['title', 'isbn', 'author', 'category', 'publisher', 'language', 'year', 'pages', 'totalCopies', 'price', 'description'];

function coverDataUrl(file) {
  return file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : null;
}

// Lấy các trường cho phép, bỏ chuỗi rỗng; chapters có thể gửi dạng chuỗi JSON (multipart)
function pickBody(body) {
  const data = {};
  FIELDS.forEach((field) => {
    if (body[field] !== undefined && body[field] !== '') data[field] = body[field];
  });
  if (body.chapters !== undefined && body.chapters !== '') {
    try {
      data.chapters = typeof body.chapters === 'string' ? JSON.parse(body.chapters) : body.chapters;
    } catch (error) {
      throw new ApiError(400, 'Danh sách chương không hợp lệ');
    }
  }
  return data;
}

const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await bookService.listBooks(req.query);
  res.json({ success: true, data: data.map(bookService.bookDto), pagination });
});

const getOne = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).populate(bookService.POPULATE);
  if (!book) throw new ApiError(404, 'Không tìm thấy sách');
  res.json({ success: true, data: bookService.bookDto(book) });
});

const create = asyncHandler(async (req, res) => {
  const data = pickBody(req.body);
  if (req.file) data.cover = coverDataUrl(req.file);

  const book = await Book.create(data); // availableCopies tự bằng totalCopies
  await book.populate(bookService.POPULATE);
  res.status(201).json({ success: true, data: bookService.bookDto(book) });
});

const update = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Không tìm thấy sách');

  const data = pickBody(req.body);
  const newCover = coverDataUrl(req.file);

  try {
    // Đổi tổng số bản: giữ nguyên số bản đang được mượn
    if (data.totalCopies !== undefined) {
      const borrowed = book.totalCopies - book.availableCopies;
      if (data.totalCopies < borrowed) throw new ApiError(400, `Đang có ${borrowed} bản được mượn, tổng số bản không thể nhỏ hơn`);
      book.availableCopies = data.totalCopies - borrowed;
    }
    book.set(data);
    if (newCover) book.cover = newCover;
    await book.save();
  } catch (error) {
    throw error;
  }

  await book.populate(bookService.POPULATE);
  res.json({ success: true, data: bookService.bookDto(book) });
});

// Chỉ xóa sách đã trả hết; lưu thông tin sách trong phiếu để giữ lịch sử mượn.
const remove = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Không tìm thấy sách');
  const activeLoan = await Loan.exists({
    status: { $in: loanService.ACTIVE },
    items: { $elemMatch: { book: book._id, returnDate: null } }
  });
  if (activeLoan) {
    throw new ApiError(409, 'Sách vẫn đang được mượn, không thể xóa');
  }

  await Loan.updateMany(
    { 'items.book': book._id },
    {
      $set: {
        'items.$[item].bookId': String(book._id),
        'items.$[item].bookTitle': book.title,
        'items.$[item].bookIsbn': book.isbn
      }
    },
    { arrayFilters: [{ 'item.book': book._id }] }
  );

  const deleted = await Book.deleteOne({ _id: book._id, availableCopies: book.totalCopies });
  if (!deleted.deletedCount) {
    throw new ApiError(409, 'Sách đang được mượn hoặc số lượng kho vừa thay đổi, vui lòng thử lại');
  }
  res.json({ success: true, message: 'Đã xóa sách' });
});

module.exports = { list, getOne, create, update, remove };

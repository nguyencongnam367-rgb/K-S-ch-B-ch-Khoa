const Book = require('../../models/book.model');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex } = require('../../utils/apiFeatures');

// Thể loại và tác giả có CRUD giống nhau nên dùng chung một bộ xử lý.
// field: trường tham chiếu trong collection books ('category' hoặc 'author')
function createTaxonomyController({ Model, field, label, descField }) {
  async function countsByBook() {
    const rows = await Book.aggregate([{ $group: { _id: `$${field}`, n: { $sum: 1 } } }]);
    return new Map(rows.map((row) => [String(row._id), row.n]));
  }

  const toDto = (doc, counts) => ({
    id: String(doc._id),
    name: doc.name,
    [descField]: doc[descField] || '',
    bookCount: counts.get(String(doc._id)) || 0,
    createdAt: doc.createdAt
  });

  const pick = (body) => {
    const data = { name: body.name };
    if (body[descField] !== undefined) data[descField] = body[descField];
    return data;
  };

  const list = asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const filter = q ? { name: new RegExp(escapeRegex(q), 'i') } : {};
    const [docs, counts] = await Promise.all([Model.find(filter), countsByBook()]);
    docs.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    res.json({ success: true, data: docs.map((doc) => toDto(doc, counts)) });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new ApiError(404, `Không tìm thấy ${label.toLowerCase()}`);
    res.json({ success: true, data: toDto(doc, await countsByBook()) });
  });

  const create = asyncHandler(async (req, res) => {
    const doc = await Model.create(pick(req.body));
    res.status(201).json({ success: true, data: toDto(doc, new Map()) });
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, pick(req.body), { returnDocument: 'after', runValidators: true });
    if (!doc) throw new ApiError(404, `Không tìm thấy ${label.toLowerCase()}`);
    res.json({ success: true, data: toDto(doc, await countsByBook()) });
  });

  // Không xóa được khi còn sách thuộc thể loại / tác giả này
  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new ApiError(404, `Không tìm thấy ${label.toLowerCase()}`);
    const books = await Book.countDocuments({ [field]: doc._id });
    if (books > 0) throw new ApiError(409, `${label} đang có ${books} sách, không thể xóa`);
    await doc.deleteOne();
    res.json({ success: true, message: `Đã xóa ${label.toLowerCase()}` });
  });

  return { list, getOne, create, update, remove, countsByBook, toDto };
}

module.exports = createTaxonomyController;

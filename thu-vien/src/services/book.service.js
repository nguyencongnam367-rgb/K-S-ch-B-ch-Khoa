const Book = require('../models/book.model');
const Author = require('../models/author.model');
const Category = require('../models/category.model');
const { APIFeatures, escapeRegex } = require('../utils/apiFeatures');

const POPULATE = [{ path: 'author', select: 'name' }, { path: 'category', select: 'name' }];

// Tìm sách theo tên, ISBN, tên tác giả hoặc tên thể loại; lọc theo category, author, publisher, language, available
async function listBooks(query) {
  const base = {};
  const q = String(query.q || '').trim();

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    const [authors, categories] = await Promise.all([
      Author.find({ name: regex }).select('_id').lean(),
      Category.find({ name: regex }).select('_id').lean()
    ]);
    base.$or = [
      { title: regex },
      { isbn: regex },
      { author: { $in: authors.map((a) => a._id) } },
      { category: { $in: categories.map((c) => c._id) } }
    ];
  }

  if (query.available === 'true') base.availableCopies = { $gt: 0 };
  if (query.available === 'false') base.availableCopies = 0;

  return new APIFeatures(Book, query, base)
    .filter(['category', 'author', 'publisher', 'language'])
    .sort(['title', 'createdAt', 'year', 'price', 'availableCopies'], '-createdAt')
    .exec({ populate: POPULATE });
}

// Các giá trị đang có để làm bộ lọc (nhà xuất bản, ngôn ngữ)
async function facets() {
  const [publishers, languages] = await Promise.all([Book.distinct('publisher'), Book.distinct('language')]);
  return {
    publishers: publishers.filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi')),
    languages: languages.filter(Boolean)
  };
}

function bookDto(book) {
  const ref = (value) => (value && value.name ? { id: String(value._id), name: value.name } : { id: String(value) });
  return {
    id: String(book._id),
    isbn: book.isbn,
    title: book.title,
    author: ref(book.author),
    category: ref(book.category),
    publisher: book.publisher,
    language: book.language,
    year: book.year,
    pages: book.pages,
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    price: book.price,
    cover: book.cover,
    description: book.description,
    chapters: book.chapters,
    createdAt: book.createdAt
  };
}

module.exports = { listBooks, facets, bookDto, POPULATE };

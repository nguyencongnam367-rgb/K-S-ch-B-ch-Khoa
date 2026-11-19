const mongoose = require('mongoose');
const Book = require('../../models/book.model');
const Category = require('../../models/category.model');
const Author = require('../../models/author.model');
const User = require('../../models/user.model');
const ApiError = require('../../utils/ApiError');
const { pageLinks } = require('../../utils/apiFeatures');
const bookService = require('../../services/book.service');
const loanService = require('../../services/loan.service');
const categoryCtrl = require('../api/category.controller');
const authorCtrl = require('../api/author.controller');
const { LOAN_LIMIT_PER_READER, REMIND_BEFORE_DAYS } = require('../../config/constants');

const ACCENTS = ['green', 'beige', 'taupe', 'red', 'dark'];
const LANGUAGES = { vi: 'Tiếng Việt', en: 'Tiếng Anh', other: 'Khác' };

const hash = (text) => [...String(text)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const accentOf = (key) => ACCENTS[hash(key) % ACCENTS.length];
const formatMoney = (amount) => `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

function formatDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Bìa chữ khi sách chưa có ảnh: tách tên thành hai dòng
function coverLines(title) {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return [words[0], ''];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

// Dữ liệu một thẻ sách (dùng ở trang chủ và danh sách sách)
function toBookCard(book) {
  const copies = book.availableCopies;
  return {
    id: String(book._id),
    title: book.title,
    description: book.description,
    author: book.author && book.author.name ? book.author.name : '',
    category: book.category && book.category.name ? book.category.name : '',
    accent: accentOf(book.category && book.category.name ? book.category.name : book.title),
    coverLines: coverLines(book.title),
    cover: book.cover,
    available: copies > 0,
    availability: copies > 0 ? `Còn ${copies}` : 'Hết sách'
  };
}

const homeStyles = [
  '/css/components/header.css',
  '/css/components/footer.css',
  '/css/components/button.css',
  '/css/components/input.css',
  '/css/components/book-card.css',
  '/css/layouts/main.css'
];

async function renderHome(req, res) {
  const [newest, books, categories, readers] = await Promise.all([
    Book.find().sort('-createdAt').limit(5).populate(bookService.POPULATE),
    Book.countDocuments(),
    Category.countDocuments(),
    User.countDocuments({ role: 'user' })
  ]);

  res.render('layouts/main', {
    title: 'Trang chủ',
    page: 'pages/home',
    pageClass: 'home-page',
    user: req.user || null,
    books: newest.map(toBookCard),
    stats: { books: books.toLocaleString('vi-VN'), categories, readers: readers.toLocaleString('vi-VN') },
    showHeader: true,
    showFooter: true,
    pageStyles: [...homeStyles, '/css/pages/home.css']
  });
}

// Danh sách sách: tìm kiếm + lọc theo thể loại, tác giả, nhà xuất bản, ngôn ngữ
async function renderBookList(req, res) {
  const query = {};
  ['q', 'category', 'author', 'publisher', 'language', 'available'].forEach((key) => {
    if (typeof req.query[key] === 'string' && req.query[key] !== '') query[key] = req.query[key];
  });
  if (req.query.page) query.page = req.query.page;

  const [{ data, pagination }, facets, categories, authors] = await Promise.all([
    bookService.listBooks({ ...query, limit: 12 }),
    bookService.facets(),
    Category.find().select('name').lean(),
    Author.find().select('name').lean()
  ]);
  const byName = (a, b) => a.name.localeCompare(b.name, 'vi');
  const label = (id, list) => (list.find((item) => String(item._id) === id) || {}).name;

  const activeFilters = [];
  if (query.category) activeFilters.push({ label: 'Thể loại', value: label(query.category, categories) });
  if (query.author) activeFilters.push({ label: 'Tác giả', value: label(query.author, authors) });
  if (query.publisher) activeFilters.push({ label: 'Nhà xuất bản', value: query.publisher });
  if (query.language) activeFilters.push({ label: 'Ngôn ngữ', value: LANGUAGES[query.language] || query.language });

  res.render('layouts/main', {
    title: 'Khám phá sách',
    page: 'pages/books',
    pageClass: 'books-page',
    user: req.user || null,
    books: data.map(toBookCard),
    total: pagination.total,
    query,
    activeFilters,
    categories: categories.sort(byName).map((c) => ({ id: String(c._id), name: c.name })),
    authors: authors.sort(byName).map((a) => ({ id: String(a._id), name: a.name })),
    publishers: facets.publishers,
    languages: facets.languages.map((code) => ({ code, label: LANGUAGES[code] || code })),
    pager: pageLinks('/books', query, pagination),
    showHeader: true,
    showFooter: true,
    pageStyles: [
      ...homeStyles,
      '/css/components/filter-chips.css',
      '/css/components/pagination.css',
      '/css/pages/home.css',
      '/css/pages/books.css'
    ],
    pageScripts: ['/js/ui.js']
  });
}

// Danh mục: hai tab Thể loại / Tác giả trong một trang
async function renderCatalog(req, res) {
  const [categories, authors, categoryCounts, authorCounts] = await Promise.all([
    Category.find(),
    Author.find(),
    categoryCtrl.countsByBook(),
    authorCtrl.countsByBook()
  ]);
  const byName = (a, b) => a.name.localeCompare(b.name, 'vi');

  res.render('layouts/main', {
    title: 'Danh mục',
    page: 'pages/catalog',
    pageClass: 'catalog-page',
    user: req.user || null,
    activeTab: req.query.tab === 'authors' ? 'authors' : 'categories',
    categories: categories.sort(byName).map((c) => ({ id: String(c._id), name: c.name, description: c.description, count: categoryCounts.get(String(c._id)) || 0 })),
    authors: authors.sort(byName).map((a) => ({ id: String(a._id), name: a.name, description: a.bio, count: authorCounts.get(String(a._id)) || 0 })),
    showHeader: true,
    showFooter: true,
    pageStyles: [
      ...homeStyles,
      '/css/components/tabs.css',
      '/css/pages/catalog.css'
    ],
    pageScripts: ['/js/ui.js']
  });
}

async function renderBookDetail(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Không tìm thấy sách.');
  const doc = await Book.findById(req.params.id).populate(bookService.POPULATE);
  if (!doc) throw new ApiError(404, 'Không tìm thấy sách.');
  const activeLoanId = req.user && req.user.role === 'user'
    ? await loanService.getActiveLoanForBook(req.user.id, doc._id)
    : null;

  const book = {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    isbn: doc.isbn,
    author: { id: String(doc.author._id), name: doc.author.name },
    category: { id: String(doc.category._id), name: doc.category.name },
    publisher: doc.publisher,
    language: doc.language,
    languageLabel: LANGUAGES[doc.language] || doc.language,
    yearPages: [doc.year, doc.pages ? `${doc.pages} trang` : ''].filter(Boolean).join(' · '),
    cover: doc.cover,
    chapters: doc.chapters,
    coverLines: coverLines(doc.title),
    availableCopies: doc.availableCopies,
    activeLoanId
  };

  res.render('layouts/main', {
    title: book.title,
    page: 'pages/book-detail',
    pageClass: 'book-detail-page',
    user: req.user || null,
    book,
    showHeader: true,
    showFooter: true,
    pageStyles: [
      '/css/components/header.css',
      '/css/components/footer.css',
      '/css/components/button.css',
      '/css/layouts/main.css',
      '/css/pages/book-detail.css',
      '/css/pages/book-detail-links.css'
    ],
    pageScripts: ['/js/book-detail.js']
  });
}

// Mượn của tôi: lấy phiếu của chính độc giả đang đăng nhập
async function renderMyLoans(req, res) {
  const tabs = ['all', 'active', 'history', 'reserved'];
  const activeTab = tabs.includes(req.query.tab) ? req.query.tab : 'all';
  const mine = { reader: req.user.id };

  const [active, history] = await Promise.all([
    loanService.listLoans({ status: 'active', sort: 'dueDate', limit: 50 }, mine),
    loanService.listLoans({ status: 'returned', sort: '-borrowDate', limit: 50 }, mine)
  ]);

  const holding = active.data.reduce((sum, loan) => sum + loan.items.filter((item) => !item.returned).length, 0);
  const dueSoon = active.data.filter((loan) => loan.status === 'borrowing' && loan.daysLeft <= REMIND_BEFORE_DAYS);
  const fine = active.data.reduce((sum, loan) => sum + (loan.status === 'overdue' ? loan.fine : 0), 0);

  const toView = (loan) => {
    const statusText = { overdue: `Quá ${loan.daysOverdue} ngày`, borrowing: `Còn ${loan.daysLeft} ngày`, returned: 'Đã trả' }[loan.status];
    const note = {
      overdue: `Phạt tạm tính ${formatMoney(loan.fine)}`,
      borrowing: `Nhắc qua email trước ${REMIND_BEFORE_DAYS} ngày`,
      returned: loan.fine ? `Tiền phạt ${formatMoney(loan.fine)}` : ''
    }[loan.status];
    return {
      id: loan.id,
      title: loan.items
        .filter((item) => loan.status === 'returned' || !item.returned)
        .map((item) => item.book.title || 'Sách đã xóa')
        .join(', '),
      receipt: loan.code,
      borrowedAt: formatDate(loan.borrowDate),
      dueAt: formatDate(loan.dueDate),
      returnedAt: loan.returnDate ? formatDate(loan.returnDate) : '',
      status: loan.status === 'borrowing' ? 'upcoming' : loan.status,
      statusText,
      note,
      accent: ['red', 'green', 'beige'][hash(loan.code) % 3]
    };
  };

  const lists = {
    all: [...active.data, ...history.data],
    active: active.data,
    history: history.data,
    reserved: []
  };

  res.render('layouts/main', {
    title: 'Mượn của tôi',
    page: 'pages/my-loans',
    pageClass: 'my-loans-page',
    user: req.user,
    loans: lists[activeTab].map(toView),
    activeTab,
    summary: {
      holding,
      limit: LOAN_LIMIT_PER_READER,
      dueSoon: dueSoon.length,
      dueSoonText: dueSoon.length ? `còn ${Math.min(...dueSoon.map((loan) => loan.daysLeft))} ngày` : 'chưa có',
      fineText: formatMoney(fine)
    },
    showHeader: false,
    showFooter: true,
    pageStyles: [
      '/css/components/footer.css',
      '/css/pages/my-loans.css'
    ]
  });
}

function renderAuth(req, res) {
  res.render('layouts/main', {
    title: 'Đăng nhập',
    page: 'pages/auth',
    pageClass: 'auth-page',
    showHeader: false,
    showFooter: false,
    pageScripts: ['/js/auth.js'],
    pageStyles: ['/css/pages/auth.css']
  });
}

module.exports = { renderHome, renderBookList, renderCatalog, renderMyLoans, renderBookDetail, renderAuth, formatDate, formatMoney, accentOf };

const Category = require('../../models/category.model');
const Author = require('../../models/author.model');
const { pageLinks } = require('../../utils/apiFeatures');
const bookService = require('../../services/book.service');
const loanService = require('../../services/loan.service');
const categoryCtrl = require('../api/category.controller');
const authorCtrl = require('../api/author.controller');
const { LOAN_LIMIT_PER_READER, LOAN_DAYS } = require('../../config/constants');
const { formatMoney } = require('./page.controller');

const PAGE_SIZE = 10;
const byName = (a, b) => a.name.localeCompare(b.name, 'vi');
const pick = (source, keys) => keys.reduce((out, key) => (typeof source[key] === 'string' && source[key] !== '' ? { ...out, [key]: source[key] } : out), {});

function formatDate(date, withYear = false) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}${withYear ? `/${d.getFullYear()}` : ''}`;
}

// Gắn chữ trạng thái, tiền phạt và nhãn cho hàng phiếu mượn (component loan-row)
function toLoanRow(loan) {
  const statusText = {
    overdue: `Quá ${loan.daysOverdue} ngày`,
    borrowing: `Còn ${loan.daysLeft} ngày`,
    returned: 'Đã trả'
  }[loan.status];
  const book = loan.items
    .filter((item) => loan.status === 'returned' || !item.returned)
    .map((item) => item.book.title || 'Sách đã xóa')
    .join(', ');

  return {
    id: loan.id,
    code: loan.code,
    reader: loan.reader.name || '',
    readerCode: loan.reader.readerCode || '',
    book,
    due: formatDate(loan.dueDate),
    status: loan.status,
    statusText,
    fineText: loan.status === 'overdue' && loan.fine ? `Phạt ${formatMoney(loan.fine)}` : '',
    returnedAt: loan.returnDate ? formatDate(loan.returnDate) : '',
    tags: loan.status === 'returned' ? 'returned' : (loan.status === 'overdue' ? 'borrowing overdue' : 'borrowing'),
    searchText: `${loan.code} ${loan.reader.name} ${loan.reader.readerCode} ${book}`
  };
}

async function renderAdmin(req, res, options) {
  const { title, page, activeNav, pageStyles = [], pageScripts = [], ...data } = options;
  const { count } = await loanService.overdueTotals();
  res.render('layouts/admin', {
    title,
    page,
    activeNav,
    pageClass: `admin-${activeNav}-page`,
    user: req.user,
    overdueCount: count,
    pageStyles,
    pageScripts,
    ...data
  });
}

async function renderAdminDashboard(req, res) {
  const now = new Date();
  const [summary, top, recent] = await Promise.all([
    loanService.summaryStats(now),
    loanService.topBorrowedBooks({ limit: 5 }, now),
    loanService.listLoans({ status: 'overdue', sort: 'dueDate', limit: 3 })
  ]);
  const topBooks = top.map((book) => ({ ...book, percent: Math.round((book.count / top[0].count) * 100) }));

  await renderAdmin(req, res, {
    title: 'Tổng quan',
    page: 'pages/admin/dashboard',
    activeNav: 'dashboard',
    pageStyles: ['/css/components/stat-card.css', '/css/pages/admin/dashboard.css'],
    monthLabel: `tháng ${now.getMonth() + 1}`,
    todayLabel: formatDate(now, true),
    stats: [
      { title: 'Đầu sách', value: summary.books.toLocaleString('vi-VN'), detail: 'Trong kho thư viện' },
      { title: 'Độc giả', value: summary.readers.toLocaleString('vi-VN'), detail: 'Tài khoản đã đăng ký', variant: 'green' },
      { title: 'Đang mượn', value: summary.borrowing, detail: 'Phiếu chưa trả' },
      { title: 'Quá hạn', value: summary.overdue, detail: 'Cần nhắc trả' },
      { title: 'Tiền phạt tháng', value: formatMoney(summary.fineThisMonth), detail: 'Tạm tính', variant: 'gold' }
    ],
    topBooks,
    recentOverdue: recent.data.map((loan) => ({
      reader: loan.reader.name,
      book: loan.items.map((item) => item.book.title).join(', '),
      daysLate: loan.daysOverdue
    }))
  });
}

async function renderAdminBooks(req, res) {
  const query = pick(req.query, ['q', 'category', 'stock', 'page']);
  const [{ data, pagination }, categories, authors] = await Promise.all([
    bookService.listBooks({
      q: query.q,
      category: query.category,
      available: { in: 'true', out: 'false' }[query.stock],
      page: query.page,
      limit: PAGE_SIZE,
      sort: 'title'
    }),
    Category.find().select('name').lean(),
    Author.find().select('name').lean()
  ]);
  const palette = ['#1f6b45', '#d9cdb0', '#c8322b', '#4a443a', '#8c7a5e'];

  await renderAdmin(req, res, {
    title: 'Quản lý sách',
    page: 'pages/admin/books',
    activeNav: 'books',
    pageStyles: ['/css/components/pagination.css', '/css/pages/admin/books.css'],
    books: data.map((book, index) => ({
      id: String(book._id),
      title: book.title,
      author: book.author ? book.author.name : '',
      category: book.category ? book.category.name : '',
      isbn: book.isbn,
      available: book.availableCopies,
      total: book.totalCopies,
      cover: book.cover,
      color: palette[index % palette.length]
    })),
    categories: categories.sort(byName).map((c) => ({ id: String(c._id), name: c.name })),
    authors: authors.sort(byName).map((a) => ({ id: String(a._id), name: a.name })),
    query,
    pager: pageLinks('/admin/books', query, pagination)
  });
}

async function renderAdminTaxonomy(req, res) {
  const [categories, authors, categoryCounts, authorCounts] = await Promise.all([
    Category.find(), Author.find(), categoryCtrl.countsByBook(), authorCtrl.countsByBook()
  ]);

  await renderAdmin(req, res, {
    title: 'Thể loại và tác giả',
    page: 'pages/admin/taxonomy',
    activeNav: 'taxonomy',
    pageStyles: ['/css/pages/admin/taxonomy.css'],
    panels: [
      {
        key: 'categories', tabLabel: 'Thể loại', addLabel: 'Thêm thể loại', descField: 'description',
        namePlaceholder: 'Tên thể loại', descPlaceholder: 'Mô tả ngắn',
        searchPlaceholder: 'Tìm thể loại', descHead: 'MÔ TẢ',
        rows: categories.sort(byName).map((c) => ({ id: String(c._id), name: c.name, description: c.description, count: categoryCounts.get(String(c._id)) || 0 }))
      },
      {
        key: 'authors', tabLabel: 'Tác giả', addLabel: 'Thêm tác giả', descField: 'bio',
        namePlaceholder: 'Họ và tên', descPlaceholder: 'Giới thiệu ngắn',
        searchPlaceholder: 'Tìm tác giả', descHead: 'GIỚI THIỆU',
        rows: authors.sort(byName).map((a) => ({ id: String(a._id), name: a.name, description: a.bio, count: authorCounts.get(String(a._id)) || 0 }))
      }
    ]
  });
}

async function renderAdminLoanCreate(req, res) {
  await renderAdmin(req, res, {
    title: 'Lập phiếu, trả sách',
    page: 'pages/admin/loan-create',
    activeNav: 'loan-create',
    pageStyles: ['/css/pages/admin/loan-create.css'],
    pageScripts: ['/js/loan-desk.js'],
    desk: {
      limit: LOAN_LIMIT_PER_READER,
      loanDays: LOAN_DAYS,
      prefillCode: typeof req.query.code === 'string' ? req.query.code.slice(0, 20) : ''
    }
  });
}

async function renderAdminLoans(req, res) {
  const query = pick(req.query, ['q', 'status', 'page']);
  const status = ['active', 'overdue', 'returned'].includes(query.status) ? query.status : 'all';
  const [{ data, pagination }, counts] = await Promise.all([
    loanService.listLoans({ q: query.q, status: status === 'all' ? undefined : status, page: query.page, limit: PAGE_SIZE }),
    loanService.countByStatus()
  ]);

  const hrefFor = (key) => {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (key !== 'all') params.set('status', key);
    const qs = params.toString();
    return qs ? `/admin/loans?${qs}` : '/admin/loans';
  };

  await renderAdmin(req, res, {
    title: 'Lịch sử mượn',
    page: 'pages/admin/loans',
    activeNav: 'loans',
    pageStyles: ['/css/components/pagination.css', '/css/pages/admin/loans.css'],
    loans: data.map(toLoanRow),
    query,
    activeStatus: status,
    chips: [
      { key: 'all', label: 'Tất cả', count: counts.all, href: hrefFor('all') },
      { key: 'active', label: 'Đang mượn', count: counts.active, href: hrefFor('active') },
      { key: 'overdue', label: 'Quá hạn', count: counts.overdue, tone: 'danger', href: hrefFor('overdue') },
      { key: 'returned', label: 'Đã trả', count: counts.returned, href: hrefFor('returned') }
    ],
    pager: pageLinks('/admin/loans', query, pagination)
  });
}

async function renderAdminOverdue(req, res) {
  const query = pick(req.query, ['q', 'page']);
  const [{ data, pagination }, totals] = await Promise.all([
    loanService.listLoans({ q: query.q, status: 'overdue', sort: 'dueDate', page: query.page, limit: PAGE_SIZE }),
    loanService.overdueTotals()
  ]);

  await renderAdmin(req, res, {
    title: 'Quá hạn',
    page: 'pages/admin/overdue',
    activeNav: 'overdue',
    pageStyles: ['/css/components/pagination.css', '/css/pages/admin/overdue.css'],
    loans: data.map(toLoanRow),
    query,
    totals: { count: totals.count, fine: formatMoney(totals.totalFine) },
    pager: pageLinks('/admin/overdue', query, pagination)
  });
}

module.exports = {
  renderAdminDashboard,
  renderAdminBooks,
  renderAdminTaxonomy,
  renderAdminLoanCreate,
  renderAdminLoans,
  renderAdminOverdue
};

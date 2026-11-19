const { countUsers } = require('../../services/auth.service');

// Dữ liệu mẫu cho giao diện thủ thư.
// TODO: thay bằng loan.service, book.model... khi API sẵn sàng.

const FINE_PER_DAY = 1500; // ví dụ, sau này lấy từ config/constants.js

function formatMoney(amount) {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;
}

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

const categories = [
  { name: 'Công nghệ thông tin', description: 'Lập trình, cơ sở dữ liệu, mạng', count: 128 },
  { name: 'Ngoại ngữ', description: 'Tiếng Anh chuyên ngành, giao tiếp', count: 83 },
  { name: 'Điện', description: 'Kỹ thuật điện, điện công nghiệp', count: 74 },
  { name: 'Du lịch', description: 'Lữ hành, khách sạn, nhà hàng', count: 61 },
  { name: 'Kế toán', description: 'Kế toán căn bản, thuế, kiểm toán', count: 52 },
  { name: 'Thời trang', description: 'May mặc, thiết kế', count: 21 },
  { name: 'Nghệ thuật', description: 'Mỹ thuật, thiết kế đồ họa', count: 0 }
];

const authors = [
  { name: 'Lê Minh Hùng', description: 'Giảng viên khoa Điện', count: 11 },
  { name: 'Nguyễn Văn An', description: 'Lập trình viên, giảng viên', count: 9 },
  { name: 'Trần Thị Lan', description: 'Giảng viên khoa Công nghệ thông tin', count: 8 },
  { name: 'Phạm Quốc Dũng', description: 'Chuyên gia an toàn thông tin', count: 5 },
  { name: 'Trường Cao đẳng Bách Khoa', description: 'Biên soạn giáo trình của trường', count: 18 },
  { name: 'Võ Thị Mai', description: 'Giảng viên khoa Công nghệ thông tin', count: 0 }
];

const books = [
  { title: 'Lập trình NodeJS', author: 'Trường Cao đẳng Bách Khoa', category: 'Công nghệ thông tin', isbn: '978-604-0000-01', available: 3, total: 5, color: '#1f6b45' },
  { title: 'Cơ sở dữ liệu', author: 'Trần Thị Lan', category: 'Công nghệ thông tin', isbn: '978-604-0000-02', available: 5, total: 6, color: '#d9cdb0' },
  { title: 'Quản trị nhà hàng', author: 'Nguyễn Văn Hòa', category: 'Du lịch', isbn: '978-604-0000-04', available: 0, total: 3, color: '#c8322b' },
  { title: 'Kỹ thuật điện', author: 'Lê Minh Hùng', category: 'Điện', isbn: '978-604-0000-03', available: 2, total: 4, color: '#4a443a' },
  { title: 'Kế toán căn bản', author: 'Phạm Quốc Bảo', category: 'Kế toán', isbn: '978-604-0000-05', available: 4, total: 4, color: '#8c7a5e' }
];

const rawLoans = [
  { code: 'LM-0188', reader: 'Lê Anh', readerCode: 'SV2501', book: 'Quản trị nhà hàng', due: '26/10', status: 'overdue', daysLate: 4 },
  { code: 'LM-0181', reader: 'Trần Bình', readerCode: 'SV2417', book: 'Kỹ thuật điện', due: '27/10', status: 'overdue', daysLate: 3 },
  { code: 'LM-0176', reader: 'Phạm Chi', readerCode: 'SV2333', book: 'Cơ sở dữ liệu', due: '29/10', status: 'overdue', daysLate: 1 },
  { code: 'LM-0192', reader: 'Lê Anh', readerCode: 'SV2501', book: 'Lập trình NodeJS', due: '02/11', status: 'borrowing', daysLeft: 3 },
  { code: 'LM-0195', reader: 'Võ Dũng', readerCode: 'GV018', book: 'Kế toán căn bản', due: '11/11', status: 'borrowing', daysLeft: 12 },
  { code: 'LM-0150', reader: 'Lê Anh', readerCode: 'SV2501', book: 'Cơ sở dữ liệu', due: '16/09', status: 'returned', returnedAt: '15/09' }
];

// Gắn thêm chữ trạng thái, tiền phạt và nhãn lọc cho từng phiếu
function toLoanView(loan) {
  const fine = loan.status === 'overdue' ? loan.daysLate * FINE_PER_DAY : 0;
  const statusText = {
    overdue: `Quá ${loan.daysLate} ngày`,
    borrowing: `Còn ${loan.daysLeft} ngày`,
    returned: 'Đã trả'
  }[loan.status];
  const tags = {
    overdue: 'borrowing overdue',
    borrowing: 'borrowing',
    returned: 'returned'
  }[loan.status];

  return {
    ...loan,
    fine,
    statusText,
    tags,
    fineText: fine ? `Phạt ${formatMoney(fine)}` : '',
    searchText: `${loan.code} ${loan.reader} ${loan.readerCode} ${loan.book}`
  };
}

const loans = rawLoans.map(toLoanView);
const overdueLoans = loans.filter((loan) => loan.status === 'overdue');

function renderAdmin(req, res, options) {
  const { title, page, activeNav, pageStyles = [], ...data } = options;
  res.render('layouts/admin', {
    title,
    page,
    activeNav,
    pageClass: `admin-${activeNav}-page`,
    user: req.user,
    overdueCount: overdueLoans.length,
    pageStyles,
    ...data
  });
}

function renderAdminDashboard(req, res) {
  const now = new Date();
  const borrowing = loans.filter((loan) => loan.status !== 'returned');
  const totalFine = overdueLoans.reduce((sum, loan) => sum + loan.fine, 0);
  const topBooks = [
    { title: 'Lập trình NodeJS', count: 42 },
    { title: 'Cơ sở dữ liệu', count: 33 },
    { title: 'Kế toán căn bản', count: 26 },
    { title: 'Kỹ thuật điện', count: 19 },
    { title: 'Tiếng Anh chuyên ngành', count: 15 }
  ].map((book, _index, list) => ({ ...book, percent: Math.round((book.count / list[0].count) * 100) }));

  renderAdmin(req, res, {
    title: 'Tổng quan',
    page: 'pages/admin/dashboard',
    activeNav: 'dashboard',
    pageStyles: ['/css/components/stat-card.css', '/css/pages/admin/dashboard.css'],
    monthLabel: `tháng ${now.getMonth() + 1}`,
    todayLabel: formatDate(now),
    stats: [
      { title: 'Đầu sách', value: '4.820', detail: 'Trong kho thư viện' },
      { title: 'Độc giả', value: countUsers(), detail: 'Tài khoản đã đăng ký', variant: 'green' },
      { title: 'Đang mượn', value: borrowing.length, detail: 'Phiếu chưa trả' },
      { title: 'Quá hạn', value: overdueLoans.length, detail: 'Cần nhắc trả' },
      { title: 'Tiền phạt tháng', value: formatMoney(totalFine), detail: 'Tạm tính', variant: 'gold' }
    ],
    topBooks,
    recentOverdue: overdueLoans.slice(0, 3)
  });
}

function renderAdminBooks(req, res) {
  renderAdmin(req, res, {
    title: 'Quản lý sách',
    page: 'pages/admin/books',
    activeNav: 'books',
    pageStyles: ['/css/pages/admin/books.css'],
    books,
    categories,
    authors
  });
}

function renderAdminTaxonomy(req, res) {
  renderAdmin(req, res, {
    title: 'Thể loại và tác giả',
    page: 'pages/admin/taxonomy',
    activeNav: 'taxonomy',
    pageStyles: ['/css/pages/admin/taxonomy.css'],
    panels: [
      {
        key: 'categories', tabLabel: 'Thể loại', addLabel: 'Thêm thể loại',
        namePlaceholder: 'Tên thể loại', descPlaceholder: 'Mô tả ngắn',
        searchPlaceholder: 'Tìm thể loại', descHead: 'MÔ TẢ', rows: categories
      },
      {
        key: 'authors', tabLabel: 'Tác giả', addLabel: 'Thêm tác giả',
        namePlaceholder: 'Họ và tên', descPlaceholder: 'Giới thiệu ngắn',
        searchPlaceholder: 'Tìm tác giả', descHead: 'GIỚI THIỆU', rows: authors
      }
    ]
  });
}

function renderAdminLoanCreate(req, res) {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 14);

  renderAdmin(req, res, {
    title: 'Lập phiếu, trả sách',
    page: 'pages/admin/loan-create',
    activeNav: 'loan-create',
    pageStyles: ['/css/pages/admin/loan-create.css'],
    issue: {
      reader: { name: 'Lê Anh', code: 'SV2501', initials: 'LA', holding: 2, limit: 5 },
      books: [
        { title: 'Lập trình NodeJS', available: 3, color: '#1f6b45' },
        { title: 'Cơ sở dữ liệu', available: 5, color: '#d9cdb0' }
      ],
      borrowDate: formatDate(today),
      dueDate: formatDate(due),
      checks: [
        { tone: 'ok', text: 'Đủ số lượng cho cả 2 sách' },
        { tone: 'ok', text: 'Sau phiếu này giữ 4 / 5, chưa vượt giới hạn' },
        { tone: 'warn', text: 'Độc giả đang có 1 phiếu quá hạn' }
      ]
    },
    giveBack: {
      code: 'LM-0188',
      summary: 'Lê Anh · Mượn 12/10 · Hạn 26/10',
      statusText: 'Quá 4 ngày',
      books: [{ title: 'Quản trị nhà hàng', color: '#c8322b', note: '1 cuốn' }],
      daysLate: 4,
      ratePerDay: `${formatMoney(FINE_PER_DAY)} / ngày`,
      valueFactor: formatMoney(0),
      fine: formatMoney(4 * FINE_PER_DAY)
    }
  });
}

function renderAdminLoans(req, res) {
  const count = (tag) => loans.filter((loan) => loan.tags.split(' ').includes(tag)).length;

  renderAdmin(req, res, {
    title: 'Lịch sử mượn',
    page: 'pages/admin/loans',
    activeNav: 'loans',
    pageStyles: ['/css/pages/admin/loans.css'],
    loans,
    chips: [
      { key: 'all', label: 'Tất cả', count: loans.length },
      { key: 'borrowing', label: 'Đang mượn', count: count('borrowing') },
      { key: 'overdue', label: 'Quá hạn', count: count('overdue'), tone: 'danger' },
      { key: 'returned', label: 'Đã trả' }
    ]
  });
}

function renderAdminOverdue(req, res) {
  const total = overdueLoans.reduce((sum, loan) => sum + loan.fine, 0);

  renderAdmin(req, res, {
    title: 'Quá hạn',
    page: 'pages/admin/overdue',
    activeNav: 'overdue',
    pageStyles: ['/css/pages/admin/overdue.css'],
    loans: overdueLoans,
    totalFine: formatMoney(total)
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

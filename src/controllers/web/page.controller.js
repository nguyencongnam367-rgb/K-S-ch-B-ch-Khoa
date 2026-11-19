const books = [
  {
    id: 1,
    title: 'Lập trình NodeJS',
    subtitle: 'RESTful Web Service',
    author: 'Trương Cao Đăng Bách Khoa',
    category: 'Công nghệ thông tin',
    language: 'Tiếng Việt',
    pages: '2026 - 97 trang',
    isbn: '978-604-0000-01',
    publisher: 'Thư viện BK',
    type: 'Giáo trình',
    accent: 'green',
    coverLines: ['Lập trình', 'NodeJS'],
    availability: 'Còn 3',
    description: 'Từ nền tảng Event Loop đến xây dựng RESTful API hoàn chỉnh với Express, MongoDB, JWT và triển khai trên Internet.',
    chapters: [
      { title: 'Tổng quan NodeJS và JavaScript hiện đại', page: 4 },
      { title: 'Module, NPM và các module lỗi', page: 22 },
      { title: 'Framework Express.js', page: 35 },
      { title: 'Kiến trúc và xây dựng RESTful Web Service', page: 48 },
      { title: 'Kết nối MongoDB với Mongoose', page: 65 },
      { title: 'Bảo mật, xác thực JWT và triển khai', page: 80 }
    ]
  },
  {
    id: 2,
    title: 'Cơ sở dữ liệu',
    subtitle: 'Nguyên lý và thực hành',
    author: 'Nguyễn Kim Anh',
    category: 'Công nghệ thông tin',
    language: 'Tiếng Việt',
    pages: '2024 - 280 trang',
    isbn: '978-604-0000-02',
    publisher: 'Nhà xuất bản Giáo dục',
    type: 'Giáo trình',
    accent: 'beige',
    coverLines: ['Cơ sở', 'dữ liệu'],
    availability: 'Còn 5',
    description: 'Giới thiệu mô hình dữ liệu quan hệ, cách thiết kế cơ sở dữ liệu và các thao tác truy vấn thường dùng.',
    chapters: [
      { title: 'Khái niệm cơ bản về cơ sở dữ liệu', page: 5 },
      { title: 'Mô hình dữ liệu quan hệ', page: 32 },
      { title: 'Ngôn ngữ truy vấn SQL', page: 76 },
      { title: 'Thiết kế và chuẩn hóa dữ liệu', page: 132 },
      { title: 'Giao dịch và toàn vẹn dữ liệu', page: 198 }
    ]
  },
  {
    id: 3,
    title: 'Kỹ thuật nhiệt',
    subtitle: 'Cơ sở nhiệt động lực học',
    author: 'Trần Văn Minh',
    category: 'Kỹ thuật',
    language: 'Tiếng Việt',
    pages: '2023 - 312 trang',
    isbn: '978-604-0000-03',
    publisher: 'Nhà xuất bản Khoa học và Kỹ thuật',
    type: 'Giáo trình',
    accent: 'taupe',
    coverLines: ['Kỹ thuật', 'nhiệt'],
    availability: 'Còn 2',
    description: 'Các kiến thức nền tảng về nhiệt động lực học, truyền nhiệt và ứng dụng trong kỹ thuật.',
    chapters: [
      { title: 'Các khái niệm và định luật nhiệt động lực học', page: 7 },
      { title: 'Nhiệt dung và biến đổi trạng thái', page: 54 },
      { title: 'Chu trình nhiệt và máy nhiệt', page: 112 },
      { title: 'Dẫn nhiệt và đối lưu', page: 176 },
      { title: 'Trao đổi nhiệt và ứng dụng', page: 244 }
    ]
  },
  {
    id: 4,
    title: 'Quản trị nhân sự',
    subtitle: 'Từ tuyển dụng đến phát triển đội ngũ',
    author: 'Lê Thanh Hà',
    category: 'Kinh doanh',
    language: 'Tiếng Việt',
    pages: '2022 - 256 trang',
    isbn: '978-604-0000-04',
    publisher: 'Nhà xuất bản Lao động',
    type: 'Sách tham khảo',
    accent: 'red',
    coverLines: ['Quản trị', 'nhân sự'],
    availability: 'Hết sách',
    description: 'Tổng quan các hoạt động quản trị nhân sự, từ hoạch định và tuyển dụng đến đào tạo, đánh giá và giữ chân nhân viên.',
    chapters: [
      { title: 'Tổng quan về quản trị nhân sự', page: 9 },
      { title: 'Hoạch định nguồn nhân lực', page: 42 },
      { title: 'Tuyển dụng và lựa chọn nhân viên', page: 88 },
      { title: 'Đào tạo và phát triển', page: 142 },
      { title: 'Đánh giá hiệu quả và đãi ngộ', page: 198 }
    ]
  },
  {
    id: 5,
    title: 'Kế toán căn bản',
    subtitle: 'Nguyên lý kế toán',
    author: 'Phạm Quốc Bảo',
    category: 'Kinh doanh',
    language: 'Tiếng Việt',
    pages: '2023 - 224 trang',
    isbn: '978-604-0000-05',
    publisher: 'Nhà xuất bản Tài chính',
    type: 'Sách tham khảo',
    accent: 'dark',
    coverLines: ['Kế toán', 'căn bản'],
    availability: 'Còn 4',
    description: 'Nhập môn nguyên lý kế toán, chứng từ, tài khoản và cách đọc các báo cáo tài chính cơ bản.',
    chapters: [
      { title: 'Bản chất và vai trò của kế toán', page: 5 },
      { title: 'Chứng từ và tài khoản kế toán', page: 38 },
      { title: 'Ghi sổ và định khoản nghiệp vụ', page: 82 },
      { title: 'Kế toán các hoạt động cơ bản', page: 134 },
      { title: 'Lập và đọc báo cáo tài chính', page: 184 }
    ]
  }
];

function renderHome(req, res) {
  res.render('layouts/main', {
    title: 'Trang chủ',
    page: 'pages/home',
    pageClass: 'home-page',
    user: req.user || null,
    books,
    showHeader: true,
    showFooter: true,
    pageScripts: ['/js/search.js'],
    pageStyles: [
      '/css/components/header.css',
      '/css/components/footer.css',
      '/css/components/search.css',
      '/css/components/book-card.css',
      '/css/components/button.css',
      '/css/components/input.css',
      '/css/layouts/main.css',
      '/css/pages/home.css'
    ]
  });
}

function renderMyLoans(req, res) {
  const activeLoans = [
    {
      id: 1,
      title: 'Quản trị nhà hàng',
      receipt: 'LM-0188',
      borrowedAt: '12/10/2026',
      dueAt: '26/10/2026',
      status: 'overdue',
      statusText: 'Quá 4 ngày',
      note: 'Phạt tạm tính 6.000đ',
      accent: 'red'
    },
    {
      id: 2,
      title: 'Lập trình NodeJS',
      receipt: 'LM-0192',
      borrowedAt: '19/10/2026',
      dueAt: '02/11/2026',
      status: 'upcoming',
      statusText: 'Còn 3 ngày',
      note: 'Nhắc qua email trước 2 ngày',
      accent: 'green'
    }
  ];
  const historyLoans = [
    {
      id: 3,
      title: 'Cơ sở dữ liệu',
      receipt: 'LM-0150',
      borrowedAt: '02/09/2026',
      returnedAt: '15/09/2026',
      status: 'returned',
      statusText: 'Đã trả',
      accent: 'beige'
    }
  ];
  const tabs = ['all', 'active', 'history', 'reserved'];
  const activeTab = tabs.includes(req.query.tab) ? req.query.tab : 'all';
  const loans = activeTab === 'history'
    ? historyLoans
    : activeTab === 'reserved'
      ? []
      : activeTab === 'all'
        ? [...activeLoans, ...historyLoans]
        : activeLoans;

  res.render('layouts/main', {
    title: 'Mượn của tôi',
    page: 'pages/my-loans',
    pageClass: 'my-loans-page',
    user: req.user || null,
    loans,
    activeTab,
    showHeader: false,
    showFooter: true,
    pageStyles: [
      '/css/components/footer.css',
      '/css/pages/my-loans.css'
    ]
  });
}

function renderBookDetail(req, res) {
  const bookId = Number(req.params.id);
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return res.status(404).send('Không tìm thấy sách.');
  }

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
      '/css/pages/book-detail.css'
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

module.exports = { renderHome, renderMyLoans, renderBookDetail, renderAuth };

// Nạp dữ liệu mẫu: npm run seed  (xóa dữ liệu cũ rồi tạo lại)
require('dotenv').config();

const connectDB = require('../src/config/db');
const { disconnectDB } = require('../src/config/db');
const Category = require('../src/models/category.model');
const Author = require('../src/models/author.model');
const Book = require('../src/models/book.model');
const User = require('../src/models/user.model');
const Loan = require('../src/models/loan.model');
const Counter = require('../src/models/counter.model');
const authService = require('../src/services/auth.service');
const fineService = require('../src/services/fine.service');
const { LOAN_DAYS } = require('../src/config/constants');

const daysAgo = (n) => fineService.addDays(new Date(), -n);

async function seed() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    throw new Error('Không chạy seed ở production (thêm --force nếu thật sự muốn).');
  }

  await connectDB();
  await Promise.all([Category, Author, Book, User, Loan, Counter].map((Model) => Model.deleteMany({})));

  // ---- Thể loại, tác giả ----
  const categories = await Category.insertMany([
    { name: 'Công nghệ thông tin', description: 'Lập trình, cơ sở dữ liệu, mạng' },
    { name: 'Ngoại ngữ', description: 'Tiếng Anh chuyên ngành, giao tiếp' },
    { name: 'Điện', description: 'Kỹ thuật điện, điện công nghiệp' },
    { name: 'Du lịch', description: 'Lữ hành, khách sạn, nhà hàng' },
    { name: 'Kế toán', description: 'Kế toán căn bản, thuế, kiểm toán' },
    { name: 'Thời trang', description: 'May mặc, thiết kế' },
    { name: 'Nghệ thuật', description: 'Mỹ thuật, thiết kế đồ họa' }
  ]);
  const cat = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const authors = await Author.insertMany([
    { name: 'Trường Cao đẳng Bách Khoa', bio: 'Biên soạn giáo trình của trường' },
    { name: 'Trần Thị Lan', bio: 'Giảng viên khoa Công nghệ thông tin' },
    { name: 'Lê Minh Hùng', bio: 'Giảng viên khoa Điện' },
    { name: 'Nguyễn Văn An', bio: 'Lập trình viên, giảng viên' },
    { name: 'Phạm Quốc Dũng', bio: 'Chuyên gia an toàn thông tin' },
    { name: 'Võ Thị Mai', bio: 'Giảng viên khoa Công nghệ thông tin' }
  ]);
  const au = Object.fromEntries(authors.map((a) => [a.name, a._id]));

  // ---- Sách ----
  const nodeChapters = [
    { title: 'Tổng quan NodeJS và JavaScript hiện đại', page: 4 },
    { title: 'Module, NPM và các module lõi', page: 22 },
    { title: 'Framework Express.js', page: 35 },
    { title: 'Kiến trúc và xây dựng RESTful Web Service', page: 48 },
    { title: 'Kết nối MongoDB với Mongoose', page: 65 },
    { title: 'Bảo mật, xác thực JWT và triển khai', page: 80 }
  ];
  const bachKhoa = 'Trường Cao đẳng Bách Khoa';
  const [nodejs, csdl, nhahang, dien, ketoan, express, mongo, es6, bmat, git] = await Book.create([
    { isbn: '978-604-0000-01', title: 'Lập trình NodeJS', author: au[bachKhoa], category: cat['Công nghệ thông tin'], publisher: bachKhoa, year: 2026, pages: 97, totalCopies: 5, price: 85000, description: 'Từ nền tảng Event Loop đến xây dựng RESTful API hoàn chỉnh với Express, MongoDB, JWT và triển khai lên Internet.', chapters: nodeChapters },
    { isbn: '978-604-0000-02', title: 'Cơ sở dữ liệu', author: au['Trần Thị Lan'], category: cat['Công nghệ thông tin'], publisher: 'Nhà xuất bản Giáo dục', year: 2024, pages: 280, totalCopies: 6, price: 120000, description: 'Mô hình dữ liệu quan hệ, thiết kế cơ sở dữ liệu và các thao tác truy vấn thường dùng.' },
    { isbn: '978-604-0000-04', title: 'Quản trị nhà hàng', author: au['Võ Thị Mai'], category: cat['Du lịch'], publisher: 'Nhà xuất bản Lao động', year: 2022, pages: 256, totalCopies: 3, price: 98000, description: 'Tổ chức, vận hành và quản lý nhà hàng, khách sạn.' },
    { isbn: '978-604-0000-03', title: 'Kỹ thuật điện', author: au['Lê Minh Hùng'], category: cat['Điện'], publisher: 'Nhà xuất bản Khoa học và Kỹ thuật', year: 2023, pages: 312, totalCopies: 4, price: 150000, description: 'Kiến thức nền tảng về mạch điện, máy điện và điện công nghiệp.' },
    { isbn: '978-604-0000-05', title: 'Kế toán căn bản', author: au['Trần Thị Lan'], category: cat['Kế toán'], publisher: 'Nhà xuất bản Tài chính', year: 2023, pages: 224, totalCopies: 4, price: 90000, description: 'Nguyên lý kế toán, chứng từ, tài khoản và báo cáo tài chính cơ bản.' },
    { isbn: '978-604-0000-06', title: 'Express thực chiến', author: au['Nguyễn Văn An'], category: cat['Công nghệ thông tin'], publisher: 'Nhà xuất bản Thông tin', year: 2025, pages: 180, totalCopies: 3, price: 110000, description: 'Xây dựng API với Express: routing, middleware, xử lý lỗi.' },
    { isbn: '978-604-0000-07', title: 'MongoDB căn bản', author: au['Trần Thị Lan'], category: cat['Công nghệ thông tin'], publisher: bachKhoa, year: 2025, pages: 150, totalCopies: 5, price: 75000, description: 'Thiết kế collection, truy vấn và lập chỉ mục trong MongoDB.' },
    { isbn: '978-604-0000-08', title: 'JavaScript ES6+', author: au['Nguyễn Văn An'], category: cat['Công nghệ thông tin'], publisher: 'Nhà xuất bản Thông tin', year: 2024, pages: 210, totalCopies: 4, price: 95000, description: 'Cú pháp JavaScript hiện đại: let/const, arrow function, async/await.' },
    { isbn: '978-604-0000-09', title: 'Bảo mật ứng dụng web', author: au['Phạm Quốc Dũng'], category: cat['Công nghệ thông tin'], publisher: 'Nhà xuất bản Khoa học và Kỹ thuật', year: 2024, pages: 240, totalCopies: 2, price: 135000, description: 'Các lỗ hổng phổ biến theo OWASP và cách phòng tránh.' },
    { isbn: '978-604-0000-10', title: 'Git và GitHub', author: au['Võ Thị Mai'], category: cat['Công nghệ thông tin'], publisher: bachKhoa, year: 2025, pages: 120, totalCopies: 6, price: 60000, description: 'Quản lý mã nguồn và làm việc nhóm với Git.' },
    { isbn: '978-0-596-80-001', title: 'REST API Design Rulebook', author: au['Nguyễn Văn An'], category: cat['Công nghệ thông tin'], publisher: "O'Reilly Media", language: 'en', year: 2011, pages: 114, totalCopies: 2, price: 180000, description: 'Designing consistent RESTful Web Service interfaces.' },
    { isbn: '978-604-0000-11', title: 'Tiếng Anh chuyên ngành', author: au['Võ Thị Mai'], category: cat['Ngoại ngữ'], publisher: 'Nhà xuất bản Giáo dục', year: 2022, pages: 200, totalCopies: 5, price: 70000, description: 'Từ vựng và mẫu câu tiếng Anh cho các ngành kỹ thuật.' }
  ]);

  // ---- Tài khoản: thủ thư (từ .env) + độc giả mẫu ----
  await authService.initializeUsers();
  const readers = [];
  for (const [name, email, type] of [
    ['Lê Anh', 'leanh@bk.edu.vn', 'student'],
    ['Trần Bình', 'tranbinh@bk.edu.vn', 'student'],
    ['Phạm Chi', 'phamchi@bk.edu.vn', 'student'],
    ['Võ Dũng', 'vodung@bk.edu.vn', 'lecturer']
  ]) {
    readers.push(await authService.createReader({ name, email, password: '123456', readerType: type }));
  }
  const reader = Object.fromEntries(readers.map((r) => [r.name, r.id]));

  // ---- Phiếu mượn mẫu: quá hạn, còn hạn, đã trả ----
  async function loan(readerName, books, borrowedDaysAgo, returnedDaysAgo) {
    const borrowDate = daysAgo(borrowedDaysAgo);
    const dueDate = fineService.addDays(borrowDate, LOAN_DAYS);
    const returnDate = returnedDaysAgo !== undefined ? daysAgo(returnedDaysAgo) : undefined;
    const doc = {
      code: `LM-${String(await Counter.next('loan')).padStart(4, '0')}`,
      reader: reader[readerName],
      items: books.map((b) => ({ book: b._id, priceAtLoan: b.price })),
      borrowDate,
      dueDate,
      returnDate,
      status: returnDate ? 'returned' : (dueDate < fineService.startOfDay(new Date()) ? 'overdue' : 'borrowing')
    };
    if (returnDate) doc.fine = fineService.calculateFine(doc).total;
    const created = await Loan.create(doc);
    if (!returnDate) await Promise.all(books.map((b) => Book.updateOne({ _id: b._id }, { $inc: { availableCopies: -1 } })));
    return created;
  }

  await loan('Lê Anh', [nhahang], LOAN_DAYS + 4); // quá hạn 4 ngày
  await loan('Trần Bình', [dien], LOAN_DAYS + 3); // quá hạn 3 ngày
  await loan('Phạm Chi', [csdl], LOAN_DAYS + 1); // quá hạn 1 ngày
  await loan('Lê Anh', [nodejs], LOAN_DAYS - 3); // còn 3 ngày
  await loan('Võ Dũng', [ketoan], 2); // còn 12 ngày
  await loan('Lê Anh', [csdl], 58, 45); // đã trả đúng hạn
  await loan('Trần Bình', [express, mongo], 40, 24); // đã trả trễ, có phạt
  void es6; void bmat; void git;

  console.log('Đã nạp dữ liệu mẫu:');
  console.log(`  Thủ thư: ${process.env.ADMIN_EMAIL || 'admin@gmail.com'} / ${process.env.ADMIN_PASSWORD || '123456'}`);
  console.log('  Độc giả: leanh@bk.edu.vn, tranbinh@bk.edu.vn, phamchi@bk.edu.vn, vodung@bk.edu.vn / 123456');
}

seed()
  .catch((error) => { console.error('Seed lỗi:', error.message); process.exitCode = 1; })
  .finally(() => disconnectDB());

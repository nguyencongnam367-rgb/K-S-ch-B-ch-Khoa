# Thư viện Bách Khoa

Website quản lý thư viện và mượn trả sách (NodeJS, Express, MongoDB/Mongoose, JWT, bcrypt, EJS).
Độc giả tra cứu sách và xem lịch sử mượn; thủ thư quản lý sách, lập phiếu, trả sách, tính phạt, theo dõi quá hạn.

## Chạy dự án

1. Cài Node.js (bản LTS) và MongoDB (cài cục bộ, hoặc dùng MongoDB Atlas).
2. `npm install`
3. Sao chép `.env.example` thành `.env`, chỉnh `MONGODB_URI` nếu cần.
4. `npm run seed` để nạp dữ liệu mẫu (xóa dữ liệu cũ).
5. `npm run dev` rồi mở http://localhost:3000

Tài khoản mẫu (sau khi seed):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Thủ thư | `admin@gmail.com` | `123456` |
| Độc giả | `leanh@bk.edu.vn` (còn `tranbinh@`, `phamchi@`, `vodung@`) | `123456` |

Trước khi triển khai, đặt `JWT_SECRET` (từ 32 ký tự) và `ADMIN_PASSWORD` (từ 12 ký tự) trong `.env`.
Server tự tạo tài khoản thủ thư từ `.env` nếu chưa có.

## Trang web

| Đường dẫn | Dành cho | Nội dung |
|---|---|---|
| `/` | Mọi người | Trang chủ, tìm kiếm, sách mới |
| `/books` | Mọi người | Danh sách sách, lọc theo thể loại, tác giả, nhà xuất bản, ngôn ngữ |
| `/books/:id` | Mọi người | Chi tiết sách, độc giả đăng nhập có thể mượn hoặc trả từng cuốn |
| `/catalog` | Mọi người | Danh mục: tab Thể loại, tab Tác giả |
| `/auth` | Mọi người | Đăng nhập, đăng ký độc giả |
| `/my-loans` | Độc giả | Sách đang mượn, hạn trả, tiền phạt, lịch sử |
| `/admin/dashboard` | Thủ thư | Tổng quan |
| `/admin/books` | Thủ thư | Quản lý sách, tải ảnh bìa |
| `/admin/taxonomy` | Thủ thư | Quản lý thể loại, tác giả |
| `/admin/loans/new` | Thủ thư | Lập phiếu mượn, trả sách |
| `/admin/loans` | Thủ thư | Lịch sử mượn |
| `/admin/overdue` | Thủ thư | Phiếu quá hạn, gửi nhắc |

## API `/api/v1`

Phản hồi thống nhất: `{ "success": true, "data": ..., "pagination": ... }` hoặc `{ "success": false, "message": "...", "errors": [...] }`.
Xác thực bằng JWT: cookie `thu_vien_session` (trình duyệt) hoặc header `Authorization: Bearer <token>` (Postman).

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | Công khai | Đăng ký độc giả |
| POST | `/auth/login` | Công khai | Đăng nhập, trả token |
| POST | `/auth/logout` | Đăng nhập | Đăng xuất |
| GET | `/auth/me` | Đăng nhập | Thông tin tài khoản |
| GET / POST | `/categories` | Công khai / Thủ thư | Danh sách (kèm số sách) / thêm |
| GET / PUT / DELETE | `/categories/:id` | Công khai / Thủ thư | Chi tiết / sửa / xóa |
| GET / POST | `/authors` | Công khai / Thủ thư | Như thể loại |
| GET / PUT / DELETE | `/authors/:id` | Công khai / Thủ thư | Như thể loại |
| GET | `/books` | Công khai | `q, category, author, publisher, language, available, sort, page, limit` |
| GET | `/books/:id` | Công khai | Chi tiết sách |
| POST | `/books` | Thủ thư | Thêm sách (JSON hoặc form-data kèm `cover`) |
| PUT / DELETE | `/books/:id` | Thủ thư | Sửa / xóa |
| GET | `/loans` | Thủ thư | `status=active\|borrowing\|overdue\|returned, q, page, limit` |
| POST | `/loans` | Thủ thư | Lập phiếu: `{ readerId, bookIds[] }` |
| GET | `/loans/my` | Độc giả | Lịch sử mượn của mình |
| POST | `/loans/my` | Độc giả | Tự mượn một cuốn: `{ bookId }` |
| PATCH | `/loans/my/:id/return` | Chủ phiếu (độc giả) | Trả một cuốn trong phiếu: `{ bookId }` |
| GET | `/loans/overdue` | Thủ thư | Danh sách quá hạn |
| GET | `/loans/code/:code` | Thủ thư | Tra phiếu theo mã |
| GET | `/loans/:id` | Thủ thư / chủ phiếu | Chi tiết phiếu |
| PATCH | `/loans/:id/return` | Thủ thư | Trả sách, tính phạt |
| POST | `/loans/:id/remind` | Thủ thư | Gửi email nhắc một phiếu |
| POST | `/loans/remind-overdue` | Thủ thư | Nhắc tất cả phiếu quá hạn |
| GET | `/users` | Thủ thư | Danh sách độc giả (`q, page`) |
| GET / PATCH / DELETE | `/users/:id` | Thủ thư | Chi tiết / khóa-sửa / xóa độc giả |
| GET | `/stats/summary` | Thủ thư | Số đầu sách, độc giả, đang mượn, quá hạn, tiền phạt tháng |
| GET | `/stats/top-books` | Thủ thư | Sách mượn nhiều nhất (`month=YYYY-MM`) |

Đường dẫn cũ `/api/auth/*` vẫn dùng được cho form đăng nhập, đăng xuất của giao diện.

## Nghiệp vụ do server quyết định

- **Lập phiếu**: hạn trả (mặc định 14 ngày), mã phiếu, giá sách đều do server tính, không nhận từ client.
- **Giới hạn**: mỗi độc giả giữ tối đa 5 sách (đếm từ các phiếu chưa trả).
- **Tồn kho**: số bản còn bị trừ bằng thao tác nguyên tử (`findOneAndUpdate` có điều kiện `availableCopies >= 1`), nên hai người cùng mượn cuốn cuối thì chỉ một người thành công. Lỗi giữa chừng thì hoàn lại số bản.
- **Tiền phạt** = số ngày quá hạn x 1.500đ x số cuốn + 1% tổng giá trị sách (không vượt quá giá trị sách). Chỉnh trong `.env` hoặc `src/config/constants.js`.
- **Quá hạn tự động**: cron chạy 00:05 mỗi ngày (và khi khởi động): chuyển phiếu sang `overdue`, gửi email nhắc trước hạn 2 ngày và khi quá hạn (mỗi phiếu một lần). Chưa cấu hình `SMTP_HOST` thì chỉ ghi ra console.
- **Xóa an toàn**: không xóa thể loại, tác giả đang có sách; không xóa sách còn đang được mượn hoặc độc giả đang giữ sách (HTTP 409). Sách đã trả hết có thể xóa; tên sách và ISBN vẫn được lưu trong lịch sử mượn.

## Cấu trúc

Mô hình MVC: `models` (6 collection: users, categories, authors, books, loans, counters), `controllers/api` và `controllers/web`, `services` (loan, fine, mail, book, auth), `routes`, `middlewares` (protect, authorize, validate, upload, error), `validators`, `jobs`, `utils`, `views` (EJS, chia component), `public`.
Giao diện thủ thư dùng chung `layouts/admin.ejs` và các component: `admin-sidebar`, `page-heading`, `search-row`, `filter-chips`, `tabs`, `pagination`, `loan-row`, `button`, `input`.

## Kiểm thử

Import `postman/ThuVien.postman_collection.json` (42 request, có kiểm tra mã trạng thái). Chạy "Đăng nhập thủ thư" trước để lấy token, rồi chạy từng thư mục theo thứ tự (Đăng ký độc giả -> Thể loại -> Tác giả -> Sách -> Mượn trả).

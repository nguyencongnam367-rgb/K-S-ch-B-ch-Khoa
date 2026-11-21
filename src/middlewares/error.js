// Xử lý lỗi tập trung: mọi lỗi trả JSON thống nhất { success:false, message, errors? }
const fieldLabels = { isbn: 'ISBN', email: 'Email', name: 'Tên', code: 'Mã', readerCode: 'Mã độc giả' };

function normalizeError(err) {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Lỗi máy chủ';
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors) { // vi phạm ràng buộc Schema
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0].message;
  } else if (err.name === 'CastError') { // id sai định dạng ObjectId
    status = 400;
    message = `Giá trị ${err.path} không hợp lệ`;
  } else if (err.code === 11000) { // trùng khóa unique
    status = 409;
    const key = Object.keys(err.keyValue || {})[0];
    message = `${fieldLabels[key] || key || 'Giá trị'} đã tồn tại`;
  } else if (err.type === 'entity.parse.failed') { // JSON gửi lên sai cú pháp
    status = 400;
    message = 'Dữ liệu JSON không hợp lệ';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token không hợp lệ hoặc đã hết hạn';
  }

  if (status >= 500 && process.env.NODE_ENV === 'production') message = 'Lỗi máy chủ';
  return { status, message, errors };
}

const wantsJson = (req) => req.originalUrl.startsWith('/api') || req.accepts(['html', 'json']) === 'json';

function notFound(req, res) {
  const message = `Không tìm thấy ${req.originalUrl}`;
  if (wantsJson(req)) return res.status(404).json({ success: false, message });
  return res.status(404).send(page(404, message));
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const { status, message, errors } = normalizeError(err);
  if (status >= 500) console.error(err.stack || err);

  if (wantsJson(req)) return res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
  return res.status(status).send(page(status, message));
}

function page(status, message) {
  const safe = String(message).replace(/[<>&]/g, '');
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><title>${status}</title>
<body style="font-family:Georgia,serif;background:#f8f6f0;color:#1a1a1a;display:grid;place-items:center;min-height:100vh;margin:0">
<main style="text-align:center"><h1 style="font-size:64px;margin:0;color:#c8322b">${status}</h1><p>${safe}</p><a href="/">Về trang chủ</a></main></body></html>`;
}

module.exports = errorHandler;
module.exports.notFound = notFound;

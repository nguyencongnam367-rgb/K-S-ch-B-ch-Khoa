// Bọc hàm async để lỗi tự chuyển tới middleware xử lý lỗi
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

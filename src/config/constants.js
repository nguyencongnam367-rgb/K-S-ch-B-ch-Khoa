// Hằng số dùng chung: giới hạn mượn, mức phạt, cookie phiên, JWT...
const num = (value, fallback) => (value !== undefined && value !== '' && !Number.isNaN(Number(value)) ? Number(value) : fallback);

module.exports = {
  COOKIE_NAME: 'thu_vien_session',
  DEV_JWT_SECRET: 'development-only-secret-change-before-deployment',
  getJwtSecret: () => process.env.JWT_SECRET || 'development-only-secret-change-before-deployment',

  ROLES: { ADMIN: 'admin', USER: 'user' },

  LOAN_LIMIT_PER_READER: num(process.env.LOAN_LIMIT, 5), // số sách tối đa mỗi độc giả được giữ
  LOAN_DAYS: num(process.env.LOAN_DAYS, 14), // số ngày được mượn
  REMIND_BEFORE_DAYS: 2, // nhắc trước hạn 2 ngày

  // Tiền phạt = số ngày quá hạn x mức phạt/ngày x số cuốn + hệ số theo giá trị sách
  FINE_PER_DAY: num(process.env.FINE_PER_DAY, 1500),
  FINE_VALUE_RATE: num(process.env.FINE_VALUE_RATE, 0.01), // 1% tổng giá trị sách của phiếu

  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  COVER_MAX_SIZE: 2 * 1024 * 1024
};

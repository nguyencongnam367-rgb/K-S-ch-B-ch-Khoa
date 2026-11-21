const jwt = require('jsonwebtoken');
const authService = require('../../services/auth.service');
const { COOKIE_NAME, getJwtSecret } = require('../../config/constants');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

function signToken(user) {
  return jwt.sign({ role: user.role }, getJwtSecret(), { subject: user.id, expiresIn: '7d' });
}

// Cookie httpOnly cho trình duyệt; Postman có thể dùng token trả về trong body
function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, readerType } = req.body;

  // Vai trò luôn là độc giả, không nhận từ client
  const user = await authService.createReader({ name, email, password, readerType });
  if (!user) throw new ApiError(409, 'Email này đã được đăng ký.');

  const token = signToken(user);
  setSessionCookie(res, token);
  res.status(201).json({ success: true, user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const found = await authService.findUserByEmail(email);
  // Thông báo chung để không lộ email có tồn tại hay không
  if (!found || !(await authService.checkPassword(found, password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng.');
  }
  if (!found.isActive) throw new ApiError(403, 'Tài khoản đã bị khóa, vui lòng liên hệ thủ thư.');

  const user = authService.publicUser(found);
  const token = signToken(user);
  setSessionCookie(res, token);
  res.json({ success: true, user, token });
});

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  if (req.accepts(['html', 'json']) === 'html') return res.redirect('/auth');
  return res.json({ success: true, message: 'Đã đăng xuất.' });
}

const me = (req, res) => res.json({ success: true, data: req.user });

module.exports = { login, logout, register, me };

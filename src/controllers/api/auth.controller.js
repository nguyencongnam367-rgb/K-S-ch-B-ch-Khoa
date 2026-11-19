const jwt = require('jsonwebtoken');
const authService = require('../../services/auth.service');

const cookieName = 'thu_vien_session';
const developmentSecret = 'development-only-secret-change-before-deployment';

function getSecret() {
  return process.env.JWT_SECRET || developmentSecret;
}

function setSessionCookie(res, user) {
  const token = jwt.sign(
    { role: user.role },
    getSecret(),
    { subject: user.id, expiresIn: '7d' }
  );

  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function validEmail(email) {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function register(req, res, next) {
  const { name, email, password, confirmPassword } = req.body;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ message: 'Họ tên cần có từ 2 đến 80 ký tự.' });
  }

  if (!validEmail(email)) {
    return res.status(400).json({ message: 'Vui lòng nhập email hợp lệ.' });
  }

  if (
    typeof password !== 'string'
    || password.length < 6
    || Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({ message: 'Mật khẩu cần có ít nhất 6 ký tự và tối đa 72 byte.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Mật khẩu nhập lại chưa khớp.' });
  }

  try {
    const user = await authService.createReader({ name, email, password });
    if (!user) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
    }

    setSessionCookie(res, user);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  if (
    !validEmail(email)
    || typeof password !== 'string'
    || Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({ message: 'Vui lòng kiểm tra email và mật khẩu.' });
  }

  try {
    const user = authService.findUserByEmail(email);
    if (!user || !(await authService.checkPassword(user, password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const safeUser = authService.publicUser(user);
    setSessionCookie(res, safeUser);
    return res.json({ user: safeUser });
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  if (req.accepts('html')) {
    return res.redirect('/auth');
  }
  return res.json({ message: 'Đã đăng xuất.' });
}

module.exports = { login, logout, register };

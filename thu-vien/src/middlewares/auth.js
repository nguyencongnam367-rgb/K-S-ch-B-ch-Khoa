const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const ApiError = require('../utils/ApiError');
const { COOKIE_NAME, getJwtSecret } = require('../config/constants');

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

// Lấy token từ header Authorization: Bearer <token> (Postman) hoặc cookie phiên (trình duyệt)
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies ? req.cookies[COOKIE_NAME] : undefined;
}

// ---- Dành cho trang web: có đăng nhập thì gắn req.user, không thì bỏ qua ----
async function loadUser(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await authService.findUserById(payload.sub);

    if (user && user.isActive) {
      req.user = authService.publicUser(user);
    } else {
      clearSessionCookie(res);
    }
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      clearSessionCookie(res);
      return next();
    }
    return next(error);
  }
}

function requireAuth(req, res, next) {
  return loadUser(req, res, (error) => {
    if (error) return next(error);
    if (!req.user) return res.redirect('/auth');
    return next();
  });
}

function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.redirect('/');
    return next();
  });
}

// ---- Dành cho API: trả JSON 401 / 403 ----
async function protect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, 'Chưa đăng nhập');

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (error) {
      throw new ApiError(401, error.name === 'TokenExpiredError' ? 'Token đã hết hạn' : 'Token không hợp lệ');
    }

    const user = await authService.findUserById(payload.sub);
    if (!user || !user.isActive) throw new ApiError(401, 'Tài khoản không tồn tại hoặc đã bị khóa');

    req.user = authService.publicUser(user);
    return next();
  } catch (error) {
    return next(error);
  }
}

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này'));
  }
  return next();
};

module.exports = { loadUser, requireAdmin, requireAuth, protect, authorize };

const jwt = require('jsonwebtoken');
const { findUserById, publicUser } = require('../services/auth.service');

const cookieName = 'thu_vien_session';
const developmentSecret = 'development-only-secret-change-before-deployment';

function clearSessionCookie(res) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

function loadUser(req, res, next) {
  const token = req.cookies[cookieName];
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || developmentSecret);
    const user = findUserById(payload.sub);

    if (user) {
      req.user = publicUser(user);
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
    if (error) {
      return next(error);
    }
    if (!req.user) {
      return res.redirect('/auth');
    }
    return next();
  });
}

function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.redirect('/');
    }
    return next();
  });
}

module.exports = { loadUser, requireAdmin, requireAuth };

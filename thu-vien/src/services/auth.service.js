const mongoose = require('mongoose');
const User = require('../models/user.model');
const Counter = require('../models/counter.model');

const isProduction = process.env.NODE_ENV === 'production';
const adminEmail = (process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@gmail.com')).trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : '123456');

function checkProductionSettings() {
  if (!isProduction) return;

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Production requires a JWT_SECRET with at least 32 characters.');
  }

  if (!adminEmail || !adminPassword || adminPassword.length < 12 || Buffer.byteLength(adminPassword, 'utf8') > 72) {
    throw new Error('Production requires ADMIN_EMAIL and an ADMIN_PASSWORD with at least 12 characters.');
  }
}

// Thông tin an toàn để trả về client / gắn vào req.user (không có mật khẩu)
function publicUser(user) {
  if (!user) return null;
  return {
    id: user._id ? String(user._id) : user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    readerCode: user.readerCode || '',
    readerType: user.readerType
  };
}

// Tạo tài khoản thủ thư mặc định (lấy từ .env) nếu chưa có
async function initializeUsers() {
  checkProductionSettings();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)
    || adminPassword.length < 6
    || Buffer.byteLength(adminPassword, 'utf8') > 72
  ) {
    throw new Error('Set a valid admin email and a password with at least 6 characters.');
  }

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error('The configured admin email already belongs to a non-admin account.');
    }
    return;
  }

  await User.create({ name: 'Quản trị viên', email: adminEmail, password: adminPassword, role: 'admin' });
}

function findUserByEmail(email) {
  return User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
}

async function findUserById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return User.findById(id);
}

// Độc giả mới: role user, mã độc giả tự sinh (SV0001 / GV0001). Trả null nếu trùng email.
async function createReader({ name, email, password, readerType = 'student' }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) return null;

  const prefix = readerType === 'lecturer' ? 'GV' : 'SV';
  const seq = await Counter.next(`reader-${prefix}`);

  try {
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'user',
      readerType,
      readerCode: `${prefix}${String(seq).padStart(4, '0')}`
    });
    return publicUser(user);
  } catch (error) {
    if (error.code === 11000) return null;
    throw error;
  }
}

function checkPassword(user, password) {
  return user.checkPassword(password);
}

function countUsers() {
  return User.countDocuments({ role: 'user' });
}

module.exports = {
  checkPassword,
  countUsers,
  createReader,
  findUserByEmail,
  findUserById,
  initializeUsers,
  publicUser
};

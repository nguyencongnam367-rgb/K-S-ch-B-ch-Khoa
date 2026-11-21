const User = require('../../models/user.model');
const Loan = require('../../models/loan.model');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const loanService = require('../../services/loan.service');
const { APIFeatures } = require('../../utils/apiFeatures');
const { LOAN_LIMIT_PER_READER } = require('../../config/constants');

const userDto = (user, status = { holding: 0, overdue: 0 }) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  readerCode: user.readerCode || '',
  readerType: user.readerType,
  isActive: user.isActive,
  holding: status.holding,
  overdueCount: status.overdue,
  limit: LOAN_LIMIT_PER_READER,
  createdAt: user.createdAt
});

// Quản lý độc giả: mặc định chỉ liệt kê tài khoản độc giả
const list = asyncHandler(async (req, res) => {
  await loanService.markOverdue();
  const base = { role: req.query.role === 'admin' ? 'admin' : 'user' };
  const features = new APIFeatures(User, req.query, base)
    .search(['name', 'email', 'readerCode'])
    .filter(['isActive', 'readerType'])
    .sort(['name', 'createdAt', 'readerCode'], '-createdAt');
  const { data, pagination } = await features.exec();

  const map = data.length ? await loanService.holdingMap(data.map((u) => u._id)) : new Map();
  res.json({ success: true, data: data.map((u) => userDto(u, map.get(String(u._id)))), pagination });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Không tìm thấy độc giả');
  await loanService.markOverdue();
  const map = await loanService.holdingMap([user._id]);
  res.json({ success: true, data: userDto(user, map.get(String(user._id))) });
});

// Thủ thư chỉ được sửa tên, loại độc giả và khóa/mở khóa; không đổi vai trò
const update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'user') throw new ApiError(404, 'Không tìm thấy độc giả');

  ['name', 'readerType', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  await user.save();
  res.json({ success: true, data: userDto(user) });
});

const remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'user') throw new ApiError(404, 'Không tìm thấy độc giả');
  if (await Loan.exists({ reader: user._id, status: { $in: loanService.ACTIVE } })) {
    throw new ApiError(409, 'Độc giả đang giữ sách, không thể xóa');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'Đã xóa độc giả' });
});

module.exports = { list, getOne, update, remove };

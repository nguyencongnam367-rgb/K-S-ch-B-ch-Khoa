const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Họ tên là bắt buộc'], trim: true, minlength: [2, 'Họ tên tối thiểu 2 ký tự'], maxlength: [80, 'Họ tên tối đa 80 ký tự'] },
  email: {
    type: String, required: [true, 'Email là bắt buộc'], unique: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ']
  },
  password: { type: String, required: [true, 'Mật khẩu là bắt buộc'], minlength: [6, 'Mật khẩu tối thiểu 6 ký tự'], select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }, // user = độc giả, admin = thủ thư
  readerCode: { type: String, unique: true, sparse: true, uppercase: true },
  readerType: { type: String, enum: ['student', 'lecturer'], default: 'student' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Tự động băm mật khẩu bằng bcrypt trước khi lưu
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Tên tác giả là bắt buộc'], unique: true, trim: true, maxlength: [100, 'Tên tối đa 100 ký tự'] },
  bio: { type: String, trim: true, maxlength: [300, 'Giới thiệu tối đa 300 ký tự'], default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Author', authorSchema);

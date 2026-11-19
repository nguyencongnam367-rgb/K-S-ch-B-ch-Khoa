const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Tên thể loại là bắt buộc'], unique: true, trim: true, maxlength: [100, 'Tên tối đa 100 ký tự'] },
  description: { type: String, trim: true, maxlength: [300, 'Mô tả tối đa 300 ký tự'], default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);

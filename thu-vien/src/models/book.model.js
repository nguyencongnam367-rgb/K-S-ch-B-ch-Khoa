const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  page: { type: Number, min: 1 }
}, { _id: false });

const bookSchema = new mongoose.Schema({
  isbn: { type: String, required: [true, 'ISBN là bắt buộc'], unique: true, trim: true },
  title: { type: String, required: [true, 'Tên sách là bắt buộc'], trim: true, maxlength: [200, 'Tên sách tối đa 200 ký tự'] },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: [true, 'Tác giả là bắt buộc'] },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Thể loại là bắt buộc'] },
  publisher: { type: String, trim: true, default: '' },
  language: { type: String, enum: ['vi', 'en', 'other'], default: 'vi' },
  year: { type: Number, min: 1000, max: 3000 },
  pages: { type: Number, min: 1 },
  totalCopies: { type: Number, min: [0, 'Tổng số bản không âm'], default: 1, validate: { validator: Number.isInteger, message: 'Tổng số bản phải là số nguyên' } },
  availableCopies: { type: Number, min: [0, 'Số bản còn không âm'] },
  price: { type: Number, min: [0, 'Giá không âm'], default: 0 }, // dùng cho hệ số phạt
  cover: { type: String, default: '' }, // đường dẫn ảnh bìa: /uploads/xxx.jpg
  description: { type: String, trim: true, default: '' },
  chapters: { type: [chapterSchema], default: [] }
}, { timestamps: true });

bookSchema.pre('validate', function checkCopies() {
  if (this.availableCopies === undefined || this.availableCopies === null) this.availableCopies = this.totalCopies;
  if (this.availableCopies > this.totalCopies) {
    this.invalidate('availableCopies', 'Số bản còn không được lớn hơn tổng số bản');
  }
});

bookSchema.index({ title: 1 });
bookSchema.index({ category: 1, author: 1 });
bookSchema.index({ publisher: 1 });
bookSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Book', bookSchema);

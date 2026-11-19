const mongoose = require('mongoose');

// Mỗi phiếu mượn gồm nhiều sách (items nhúng trong phiếu vì luôn đi kèm phiếu)
const itemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  bookId: { type: String, default: '' },
  bookTitle: { type: String, trim: true, default: '' },
  bookIsbn: { type: String, trim: true, default: '' },
  priceAtLoan: { type: Number, min: 0, default: 0 }, // giá sách tại thời điểm mượn
  returnDate: { type: Date },
  fine: { type: Number, min: 0, default: 0 }
}, { _id: false });

const loanSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // LM-0188, server tự sinh
  reader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [itemSchema], validate: { validator: (v) => v.length >= 1, message: 'Phiếu mượn cần ít nhất 1 sách' } },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true }, // server tính
  returnDate: { type: Date },
  status: { type: String, enum: ['borrowing', 'overdue', 'returned'], default: 'borrowing' },
  fine: { type: Number, min: 0, default: 0 }, // server tính khi trả sách
  reminders: {
    dueSoon: { type: Boolean, default: false }, // đã gửi mail nhắc trước hạn
    overdue: { type: Boolean, default: false } // đã gửi mail báo quá hạn
  },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

loanSchema.index({ reader: 1, status: 1 }); // lịch sử mượn, đếm số sách đang giữ
loanSchema.index({ status: 1, dueDate: 1 }); // cron quét quá hạn
loanSchema.index({ 'items.book': 1 });

module.exports = mongoose.model('Loan', loanSchema);

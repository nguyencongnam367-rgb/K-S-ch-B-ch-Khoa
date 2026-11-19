const mongoose = require('mongoose');

// Bộ đếm tăng dần, dùng sinh mã phiếu mượn (LM-0001) và mã độc giả (SV0001)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

counterSchema.statics.next = async function next(name) {
  const doc = await this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);

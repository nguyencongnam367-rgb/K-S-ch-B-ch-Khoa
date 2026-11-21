const mongoose = require('mongoose');

// Kết nối MongoDB bằng Mongoose. Chuỗi kết nối lấy từ biến môi trường MONGODB_URI.
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/thu-vien';

  mongoose.connection.on('error', (error) => console.error('MongoDB lỗi:', error.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB đã ngắt kết nối'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`Đã kết nối MongoDB (${mongoose.connection.name})`);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;

// Gửi email nhắc hạn. Có cấu hình SMTP_HOST thì gửi thật bằng nodemailer,
// không có thì chỉ ghi ra console (tiện cho lúc phát triển).
let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text }) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[mail - chế độ phát triển] tới ${to}: ${subject}`);
    return { delivered: false, dev: true };
  }
  await transport.sendMail({ from: process.env.MAIL_FROM || 'Thư viện BK <no-reply@bk.edu.vn>', to, subject, text });
  return { delivered: true, dev: false };
}

const titles = (loan) => loan.items
  .filter((item) => !item.returnDate)
  .map((item) => (item.book && item.book.title) || 'Sách')
  .join(', ');
const dateText = (date) => new Date(date).toLocaleDateString('vi-VN');

function sendDueSoonReminder(loan) {
  return sendMail({
    to: loan.reader.email,
    subject: `Phiếu ${loan.code} sắp đến hạn trả`,
    text: `Chào ${loan.reader.name},\n\nPhiếu mượn ${loan.code} (${titles(loan)}) sẽ đến hạn vào ngày ${dateText(loan.dueDate)}.\nVui lòng mang sách đến quầy thủ thư để trả đúng hạn.\n\nThư viện Cao đẳng Bách Khoa`
  });
}

function sendOverdueReminder(loan, fine) {
  return sendMail({
    to: loan.reader.email,
    subject: `Phiếu ${loan.code} đã quá hạn`,
    text: `Chào ${loan.reader.name},\n\nPhiếu mượn ${loan.code} (${titles(loan)}) đã quá hạn ${fine.daysOverdue} ngày (hạn trả ${dateText(loan.dueDate)}).\nTiền phạt tạm tính: ${fine.total.toLocaleString('vi-VN')}đ.\nVui lòng mang sách đến quầy thủ thư để trả.\n\nThư viện Cao đẳng Bách Khoa`
  });
}

module.exports = { sendMail, sendDueSoonReminder, sendOverdueReminder };

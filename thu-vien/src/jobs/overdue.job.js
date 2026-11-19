const loanService = require('../services/loan.service');

// Mỗi ngày: chuyển phiếu quá hạn, nhắc trước hạn 2 ngày, báo ngay khi quá hạn
async function runOverdueCheck(now = new Date()) {
  const marked = await loanService.markOverdue(now);
  const dueSoon = await loanService.sendDueSoonReminders(now);
  const overdue = await loanService.sendOverdueReminders();
  console.log(`[cron] quá hạn mới: ${marked}, nhắc trước hạn: ${dueSoon}, nhắc quá hạn: ${overdue}`);
  return { marked, dueSoon, overdue };
}

function startOverdueJob() {
  const run = () => runOverdueCheck().catch((error) => console.error('[cron] lỗi:', error.message));
  run(); // quét ngay khi khởi động

  try {
    const cron = require('node-cron');
    cron.schedule('5 0 * * *', run); // 00:05 mỗi ngày
  } catch (error) {
    console.warn('Chưa cài node-cron, dùng bộ hẹn giờ 24 giờ thay thế');
    setInterval(run, 24 * 60 * 60 * 1000);
  }
}

module.exports = { startOverdueJob, runOverdueCheck };

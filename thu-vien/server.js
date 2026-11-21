require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initializeUsers } = require('./src/services/auth.service');
const { startOverdueJob } = require('./src/jobs/overdue.job');

const port = process.env.PORT || 3000;

connectDB()
  .then(() => initializeUsers())
  .then(() => {
    app.listen(port, () => {
      console.log(`Thu Vien server is listening on port ${port}`);
    });
    startOverdueJob();
  })
  .catch((error) => {
    console.error('Could not initialize the application:', error.message);
    console.error('Hãy kiểm tra MongoDB đã chạy chưa và biến MONGODB_URI trong file .env');
    process.exitCode = 1;
  });

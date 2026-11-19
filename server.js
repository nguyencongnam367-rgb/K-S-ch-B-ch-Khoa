require('dotenv').config();

const app = require('./src/app');
const { initializeUsers } = require('./src/services/auth.service');

const port = process.env.PORT || 3000;

initializeUsers()
  .then(() => {
    app.listen(port, () => {
      console.log(`Thu Vien server is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Could not initialize the application:', error.message);
    process.exitCode = 1;
  });

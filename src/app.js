const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/api/auth.routes');
const webRoutes = require('./routes/web.routes');
const errorHandler = require('./middlewares/error');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/v1', apiRoutes);
app.use('/api/auth', authRoutes); // giữ đường dẫn cũ cho form đăng nhập/đăng xuất của giao diện
app.use('/', webRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler.notFound);
app.use(errorHandler);

module.exports = app;

const express = require('express');
const { renderAuth, renderHome } = require('../controllers/web/page.controller');
const { loadUser, requireAdmin } = require('../middlewares/auth');
const { countUsers } = require('../services/auth.service');

const router = express.Router();

router.get('/', loadUser, renderHome);
router.get(['/auth', '/dang-nhap'], renderAuth);
router.get(['/admin', '/admin/dashboard'], requireAdmin, (req, res) => {
  res.render('layouts/main', {
    title: 'Dashboard',
    page: 'pages/admin/dashboard',
    pageClass: 'dashboard-page',
    user: req.user,
    readerCount: countUsers(),
    showHeader: false,
    showFooter: false,
    pageStyles: ['/css/pages/admin/dashboard.css', '/css/components/stat-card.css']
  });
});

module.exports = router;

const express = require('express');
const { renderAuth, renderHome, renderMyLoans, renderBookDetail } = require('../controllers/web/page.controller');
const {
  renderAdminDashboard,
  renderAdminBooks,
  renderAdminTaxonomy,
  renderAdminLoanCreate,
  renderAdminLoans,
  renderAdminOverdue
} = require('../controllers/web/admin.controller');
const { loadUser, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Trang độc giả
router.get('/', loadUser, renderHome);
router.get('/my-loans', loadUser, renderMyLoans);
router.get('/books/:id', loadUser, renderBookDetail);
router.get(['/auth', '/dang-nhap'], renderAuth);

// Trang thủ thư
router.get(['/admin', '/admin/dashboard'], requireAdmin, renderAdminDashboard);
router.get('/admin/books', requireAdmin, renderAdminBooks);
router.get('/admin/taxonomy', requireAdmin, renderAdminTaxonomy);
router.get('/admin/loans/new', requireAdmin, renderAdminLoanCreate);
router.get('/admin/loans', requireAdmin, renderAdminLoans);
router.get('/admin/overdue', requireAdmin, renderAdminOverdue);

module.exports = router;

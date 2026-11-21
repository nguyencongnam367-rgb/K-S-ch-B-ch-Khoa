const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { renderAuth, renderHome, renderBookList, renderCatalog, renderMyLoans, renderBookDetail } = require('../controllers/web/page.controller');
const {
  renderAdminDashboard,
  renderAdminBooks,
  renderAdminTaxonomy,
  renderAdminLoanCreate,
  renderAdminLoans,
  renderAdminOverdue
} = require('../controllers/web/admin.controller');
const { loadUser, requireAuth, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Trang độc giả
router.get('/', loadUser, asyncHandler(renderHome));
router.get('/books', loadUser, asyncHandler(renderBookList));
router.get('/books/:id', loadUser, asyncHandler(renderBookDetail));
router.get('/catalog', loadUser, asyncHandler(renderCatalog));
router.get('/my-loans', requireAuth, asyncHandler(renderMyLoans));
router.get(['/auth', '/dang-nhap'], renderAuth);

// Trang thủ thư
router.get(['/admin', '/admin/dashboard'], requireAdmin, asyncHandler(renderAdminDashboard));
router.get('/admin/books', requireAdmin, asyncHandler(renderAdminBooks));
router.get('/admin/taxonomy', requireAdmin, asyncHandler(renderAdminTaxonomy));
router.get('/admin/loans/new', requireAdmin, asyncHandler(renderAdminLoanCreate));
router.get('/admin/loans', requireAdmin, asyncHandler(renderAdminLoans));
router.get('/admin/overdue', requireAdmin, asyncHandler(renderAdminOverdue));

module.exports = router;

function renderHome(req, res) {
  res.render('layouts/main', {
    title: 'Trang chủ',
    page: 'pages/home',
    pageClass: 'home-page',
    user: req.user || null,
    showHeader: true,
    showFooter: true,
    pageStyles: ['/css/components/header.css', '/css/components/footer.css', '/css/layouts/main.css']
  });
}

function renderAuth(req, res) {
  res.render('layouts/main', {
    title: 'Đăng nhập',
    page: 'pages/auth',
    pageClass: 'auth-page',
    showHeader: false,
    showFooter: false,
    pageScripts: ['/js/auth.js'],
    pageStyles: ['/css/pages/auth.css']
  });
}

module.exports = { renderHome, renderAuth };

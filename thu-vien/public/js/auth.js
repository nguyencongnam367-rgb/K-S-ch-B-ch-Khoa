(function () {
  const tabs = [...document.querySelectorAll('[data-auth-tab]')];
  const panels = {
    login: document.getElementById('login-panel'),
    register: document.getElementById('register-panel')
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const active = tab.dataset.authTab;
      tabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== active;
      });
    });
  });

  document.querySelectorAll('[data-auth-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = form.querySelector('.auth-message');
      const submit = form.querySelector('[type="submit"]');
      message.hidden = true;
      message.classList.remove('is-ok');
      submit.disabled = true;

      try {
        const values = Object.fromEntries(new FormData(form).entries());
        const endpoint = form.dataset.authForm === 'register' ? '/auth/register' : '/auth/login';
        const result = await window.api.post(endpoint, values);
        const returnTo = new URLSearchParams(window.location.search).get('returnTo');
        const safeReturnTo = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
          ? returnTo
          : null;
        window.location.assign(safeReturnTo || (result.user && result.user.role === 'admin' ? '/admin/dashboard' : '/my-loans'));
      } catch (error) {
        message.textContent = error.message;
        message.hidden = false;
        submit.disabled = false;
      }
    });
  });
})();

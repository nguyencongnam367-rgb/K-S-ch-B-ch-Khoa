const authForm = document.querySelector('#auth-form');

if (authForm) {
  const authPage = document.querySelector('.auth-page');
  const title = document.querySelector('#auth-title');
  const subtitle = document.querySelector('#auth-subtitle');
  const submitButton = document.querySelector('#auth-submit');
  const switchPrompt = document.querySelector('#auth-switch-prompt');
  const loginOptions = document.querySelector('#login-options');
  const feedback = document.querySelector('#auth-feedback');
  const password = document.querySelector('#password');
  const confirmPassword = document.querySelector('#confirm-password');
  const registerFields = [...document.querySelectorAll('.auth-field--register')];
  const modeButtons = [...document.querySelectorAll('[data-auth-mode]')];

  function setMode(mode) {
    const isRegister = mode === 'register';

    authPage.classList.toggle('is-register', isRegister);
    title.innerHTML = isRegister
      ? 'Bắt đầu <em>hành trình</em>'
      : 'Chào mừng <em>trở lại</em>';
    subtitle.textContent = isRegister
      ? 'Tạo tài khoản độc giả của thư viện.'
      : 'Dùng email trường để vào thư viện.';
    submitButton.textContent = isRegister ? 'Tạo tài khoản' : 'Đăng nhập';
    loginOptions.hidden = isRegister;
    registerFields.forEach((field) => {
      field.hidden = !isRegister;
      const input = field.querySelector('input');
      input.required = isRegister;
    });
    password.autocomplete = isRegister ? 'new-password' : 'current-password';
    switchPrompt.hidden = isRegister;
    feedback.hidden = true;
    feedback.textContent = '';

    modeButtons.forEach((button) => {
      if (button.matches('.auth-tab')) {
        const active = button.dataset.authMode === mode;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
      }
    });
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.authMode));
  });

  document.querySelector('.password-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    button.setAttribute('aria-pressed', String(!visible));
    button.setAttribute('aria-label', visible ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
  });

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    confirmPassword.setCustomValidity('');

    if (!authForm.reportValidity()) {
      return;
    }

    const isRegister = !confirmPassword.closest('[hidden]');
    const data = {
      email: document.querySelector('#email').value.trim(),
      password: password.value
    };

    if (isRegister) {
      if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Mật khẩu nhập lại chưa khớp.');
        confirmPassword.reportValidity();
        return;
      }

      data.name = document.querySelector('#full-name').value.trim();
      data.confirmPassword = confirmPassword.value;
    }

    submitButton.disabled = true;
    feedback.hidden = true;

    fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Không thể xử lý yêu cầu.');
        }
        return result;
      })
      .then((result) => {
        window.location.assign(result.user.role === 'admin' ? '/admin/dashboard' : '/');
      })
      .catch((error) => {
        feedback.textContent = error.message || 'Không thể kết nối đến máy chủ.';
        feedback.hidden = false;
      })
      .finally(() => {
        submitButton.disabled = false;
      });
  });
}

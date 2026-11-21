// Thao tác của thủ thư gọi API: thêm, sửa, xóa, nhắc hạn. Cần api.js và ui.js.
(function () {
  function toast(message, isError) {
    const el = document.createElement('div');
    el.className = `toast${isError ? ' is-error' : ''}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function showMessage(form, text) {
    const el = form.querySelector('[data-form-message]');
    if (!el) return toast(text, true);
    el.textContent = text;
    el.classList.remove('is-ok');
    el.hidden = false;
    return undefined;
  }

  // Có ô chọn file (ảnh bìa) thì gửi multipart, không thì gửi JSON
  function payloadOf(form) {
    const data = new FormData(form);
    if (form.querySelector('input[type="file"]')) {
      const file = data.get('cover');
      if (file && !file.size) data.delete('cover');
      return data;
    }
    const json = {};
    data.forEach((value, key) => {
      if (value !== '') json[key] = value;
    });
    return json;
  }

  async function run(action, success) {
    try {
      const result = await action();
      if (success) success(result);
    } catch (error) {
      toast(error.message, true);
    }
  }

  function resetBookForm(form) {
    form.reset();
    form.dataset.apiUrl = '/books';
    form.dataset.apiMethod = 'POST';
    const submit = document.getElementById('book-submit');
    if (submit) submit.textContent = 'Lưu sách';

    const zone = form.querySelector('.dropzone');
    const hint = zone?.querySelector('.dropzone__hint');
    zone?.classList.remove('has-image', 'has-error');
    if (zone) zone.style.backgroundImage = '';
    if (hint) hint.textContent = hint.dataset.defaultHint || 'Kéo ảnh bìa vào đây (JPG, PNG, tối đa 2 MB)';
  }

  async function openBookEdit(id) {
    const form = document.getElementById('book-form');
    if (!form) return;

    try {
      const result = await api.get(`/books/${id}`);
      const book = result.data;

      form.hidden = false;
      form.dataset.apiUrl = `/books/${id}`;
      form.dataset.apiMethod = 'PUT';
      const submit = document.getElementById('book-submit');
      if (submit) submit.textContent = 'Cập nhật sách';
      form.reset();

      form.elements.title.value = book.title || '';
      form.elements.isbn.value = book.isbn || '';
      form.elements.totalCopies.value = book.totalCopies || 1;
      form.elements.category.value = book.category?.id || '';
      form.elements.author.value = book.author?.id || '';
      form.elements.publisher.value = book.publisher || '';
      form.elements.description.value = book.description || '';

      const zone = form.querySelector('.dropzone');
      const hint = zone?.querySelector('.dropzone__hint');
      if (zone) {
        zone.classList.remove('has-image', 'has-error');
        zone.style.backgroundImage = book.cover ? `url("${book.cover}")` : '';
        if (book.cover) zone.classList.add('has-image');
        if (hint) hint.textContent = hint.dataset.defaultHint || 'Thay ảnh bìa (JPG, PNG, tối đa 2 MB)';
      }

      document.querySelectorAll('[data-toggle="#book-form"]').forEach((trigger) => {
        trigger.setAttribute('aria-expanded', 'true');
      });
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      toast(error.message, true);
    }
  }

  function initApiForms() {
    document.querySelectorAll('[data-api-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const submit = form.querySelector('[type="submit"]');
        const message = form.querySelector('[data-form-message]');
        if (message) message.hidden = true;
        if (submit) submit.disabled = true;

        try {
          await api.request(form.dataset.apiMethod || 'POST', form.dataset.apiUrl, payloadOf(form));
          window.location.reload();
        } catch (error) {
          showMessage(form, error.message);
          if (submit) submit.disabled = false;
        }
      });
    });
  }

  function initActions() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('button, a');
      if (!target) return;

      const form = document.getElementById('book-form');
      if (target.id === 'book-form-cancel' && form) {
        resetBookForm(form);
        return;
      }

      if (target.dataset.toggle === '#book-form' && target.getAttribute('aria-expanded') === 'true' && form) {
        resetBookForm(form);
      }

      // Xóa: data-api-delete="/books/ID" data-confirm="..."
      if (target.dataset.apiDelete) {
        if (target.dataset.confirm && !window.confirm(target.dataset.confirm)) return;
        run(() => api.delete(target.dataset.apiDelete), () => window.location.reload());
        return;
      }

      // Sửa thể loại / tác giả bằng hộp nhập nhanh
      if (target.dataset.edit) {
        const name = window.prompt('Tên', target.dataset.name);
        if (name === null) return;
        const description = window.prompt('Mô tả', target.dataset.desc || '');
        if (description === null) return;
        run(() => api.put(target.dataset.edit, { name, [target.dataset.field]: description }), () => window.location.reload());
        return;
      }

      // Mở cùng form sách và chuyển sang chế độ cập nhật
      if (target.dataset.bookEdit) {
        openBookEdit(target.dataset.bookEdit);
        return;
      }

      // Gửi nhắc một phiếu / tất cả phiếu quá hạn
      if (target.dataset.remind) {
        target.disabled = true;
        run(() => api.post(`/loans/${target.dataset.remind}/remind`), (result) => toast(result.message));
        setTimeout(() => { target.disabled = false; }, 1500);
        return;
      }

      if (target.hasAttribute('data-remind-all')) {
        if (!window.confirm('Gửi email nhắc cho tất cả phiếu quá hạn?')) return;
        run(() => api.post('/loans/remind-overdue'), (result) => toast(result.message));
        return;
      }

      // Trả sách: chuyển sang bàn mượn trả với mã phiếu đã điền sẵn
      if (target.dataset.return) {
        window.location.href = `/admin/loans/new?code=${encodeURIComponent(target.dataset.return)}`;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initApiForms();
    initActions();
  });
})();

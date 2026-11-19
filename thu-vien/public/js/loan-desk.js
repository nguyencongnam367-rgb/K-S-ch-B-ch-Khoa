// Bàn mượn trả của thủ thư: lập phiếu mượn và trả sách, dữ liệu lấy từ API.
// Máy chủ vẫn kiểm tra lại tất cả (tồn kho, giới hạn, hạn trả, tiền phạt).
(function () {
  const desk = document.getElementById('loan-desk');
  if (!desk) return;

  const LIMIT = Number(desk.dataset.limit) || 5;
  const LOAN_DAYS = Number(desk.dataset.loanDays) || 14;
  const $ = (id) => document.getElementById(id);
  const money = (amount) => `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
  const fmt = (date) => new Date(date).toLocaleDateString('vi-VN');
  const debounce = (fn, wait = 250) => {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function message(node, text, ok) {
    node.textContent = text;
    node.classList.toggle('is-ok', Boolean(ok));
    node.hidden = !text;
  }

  function thumb(cover, color) {
    if (cover) {
      const img = el('img', 'thumb');
      img.src = cover;
      img.alt = '';
      return img;
    }
    const span = el('span', 'thumb');
    span.style.backgroundColor = color || '#d9cdb0';
    return span;
  }

  // ---------- Lập phiếu mượn ----------
  const state = { reader: null, books: [] };
  const readerInput = $('reader-search');
  const bookInput = $('issue-book-search');
  const submitIssue = $('issue-submit');
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + LOAN_DAYS);
  $('borrow-date').value = fmt(today);
  $('due-date').value = fmt(due);

  function fillResults(list, rows, build) {
    list.replaceChildren();
    if (!rows.length) {
      list.appendChild(el('li', 'lookup__empty', 'Không tìm thấy kết quả.'));
    } else {
      rows.forEach((row) => {
        const item = el('li');
        item.appendChild(build(row));
        list.appendChild(item);
      });
    }
    list.hidden = false;
  }

  const searchReaders = debounce(async () => {
    const q = readerInput.value.trim();
    const list = $('reader-results');
    if (!q) { list.hidden = true; return; }
    try {
      const { data } = await api.get(`/users?limit=5&q=${encodeURIComponent(q)}`);
      fillResults(list, data, (user) => {
        const button = el('button', '', `${user.name} · ${user.readerCode || user.email}`);
        button.type = 'button';
        button.appendChild(el('small', '', `đang giữ ${user.holding} / ${LIMIT}`));
        button.addEventListener('click', () => pickReader(user));
        return button;
      });
    } catch (error) {
      fillResults(list, [], () => el('span'));
    }
  });

  const searchBooks = debounce(async () => {
    const q = bookInput.value.trim();
    const list = $('book-results');
    if (!q) { list.hidden = true; return; }
    try {
      const { data } = await api.get(`/books?limit=6&q=${encodeURIComponent(q)}`);
      fillResults(list, data, (book) => {
        const button = el('button', '', book.title);
        button.type = 'button';
        button.disabled = book.availableCopies < 1;
        button.appendChild(el('small', '', book.availableCopies < 1 ? 'Hết sách' : `Còn ${book.availableCopies} bản`));
        button.addEventListener('click', () => pickBook(book));
        return button;
      });
    } catch (error) {
      fillResults(list, [], () => el('span'));
    }
  });

  function pickReader(user) {
    state.reader = user;
    readerInput.value = '';
    $('reader-results').hidden = true;
    $('reader-card').hidden = false;
    $('reader-avatar').textContent = user.name.split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
    $('reader-name').textContent = `${user.name} · ${user.readerCode || user.email}`;
    $('reader-meta').textContent = `Đang giữ ${user.holding} / ${LIMIT}`;
    refresh();
  }

  function pickBook(book) {
    if (!state.books.some((item) => item.id === book.id)) state.books.push(book);
    bookInput.value = '';
    $('book-results').hidden = true;
    refresh();
  }

  function renderBooks() {
    const list = $('picked-books');
    list.replaceChildren();
    state.books.forEach((book, index) => {
      const item = el('li', 'picked-book');
      item.appendChild(thumb(book.cover));
      const info = el('div');
      info.appendChild(el('strong', '', book.title));
      info.appendChild(el('small', 'stock stock--ok', `Còn ${book.availableCopies} bản`));
      item.appendChild(info);
      const remove = el('button', 'row-action', 'Bỏ');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Bỏ ${book.title} khỏi phiếu`);
      remove.addEventListener('click', () => { state.books.splice(index, 1); refresh(); });
      item.appendChild(remove);
      list.appendChild(item);
    });
  }

  function renderChecks() {
    const checks = [];
    const count = state.books.length;
    if (!state.reader) checks.push(['warn', 'Chưa chọn độc giả']);
    if (!count) checks.push(['warn', 'Chưa chọn sách']);

    let valid = Boolean(state.reader) && count > 0;
    if (state.reader && count) {
      checks.push(['ok', `Đủ số lượng cho ${count === 1 ? 'cuốn sách' : `cả ${count} sách`}`]);
      const after = state.reader.holding + count;
      if (after <= LIMIT) {
        checks.push(['ok', `Sau phiếu này giữ ${after} / ${LIMIT}, chưa vượt giới hạn`]);
      } else {
        checks.push(['warn', `Vượt giới hạn: sẽ giữ ${after} / ${LIMIT} sách`]);
        valid = false;
      }
      if (state.reader.overdueCount > 0) checks.push(['warn', `Độc giả đang có ${state.reader.overdueCount} phiếu quá hạn`]);
    }

    const list = $('issue-checks');
    list.replaceChildren(...checks.map(([tone, text]) => el('li', `check check--${tone}`, text)));
    submitIssue.disabled = !valid;
  }

  function refresh() {
    renderBooks();
    renderChecks();
  }

  readerInput.addEventListener('input', searchReaders);
  bookInput.addEventListener('input', searchBooks);
  readerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
  bookInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });

  $('issue-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const out = $('issue-message');
    message(out, '');
    submitIssue.disabled = true;
    try {
      const result = await api.post('/loans', { readerId: state.reader.id, bookIds: state.books.map((b) => b.id) });
      const warnings = (result.warnings || []).join('. ');
      message(out, `Đã tạo phiếu ${result.data.code}, hạn trả ${fmt(result.data.dueDate)}.${warnings ? ` ${warnings}.` : ''}`, true);
      state.books = [];
      state.reader = null;
      $('reader-card').hidden = true;
      refresh();
    } catch (error) {
      message(out, error.message, false);
      renderChecks();
    }
  });

  // ---------- Trả sách ----------
  const codeInput = $('loan-code-search');
  const returnButton = $('return-submit');
  let current = null;

  function renderLoan(loan) {
    current = loan;
    $('return-empty').hidden = true;
    $('return-detail').hidden = false;
    $('return-summary').textContent = `${loan.reader.name} · Mượn ${fmt(loan.borrowDate)} · Hạn ${fmt(loan.dueDate)}`;
    $('return-state').textContent = { overdue: `Quá ${loan.daysOverdue} ngày`, borrowing: `Còn ${loan.daysLeft} ngày`, returned: 'Đã trả' }[loan.status];

    const list = $('return-books');
    list.replaceChildren(...loan.items.map((item) => {
      const row = el('li', 'picked-book');
      row.appendChild(thumb(item.book.cover));
      const info = el('div');
      info.appendChild(el('strong', '', item.book.title || 'Sách đã xóa'));
      info.appendChild(el('small', '', '1 cuốn'));
      row.appendChild(info);
      return row;
    }));

    const detail = loan.fineDetail;
    $('fine-days').textContent = `${detail.daysOverdue} ngày`;
    $('fine-rate').textContent = `${money(detail.ratePerDay)} / ngày × ${detail.itemCount} cuốn`;
    $('fine-factor').textContent = money(detail.valueFactor);
    $('fine-total').textContent = money(loan.fine);
    returnButton.disabled = loan.status === 'returned';
  }

  async function lookupLoan(code) {
    const out = $('return-message');
    message(out, '');
    if (!code) return;
    try {
      const { data } = await api.get(`/loans/code/${encodeURIComponent(code)}`);
      renderLoan(data);
      if (data.status === 'returned') message(out, 'Phiếu này đã được trả.', false);
    } catch (error) {
      current = null;
      $('return-detail').hidden = true;
      $('return-empty').hidden = false;
      returnButton.disabled = true;
      message(out, error.message, false);
    }
  }

  codeInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    lookupLoan(codeInput.value.trim());
  });

  $('return-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!current) return;
    const out = $('return-message');
    returnButton.disabled = true;
    try {
      const result = await api.patch(`/loans/${current.id}/return`);
      renderLoan(result.data);
      message(out, result.message, true);
    } catch (error) {
      message(out, error.message, false);
      returnButton.disabled = false;
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.lookup')) {
      $('reader-results').hidden = true;
      $('book-results').hidden = true;
    }
  });

  refresh();
  const prefill = desk.dataset.prefill;
  if (prefill) {
    codeInput.value = prefill;
    lookupLoan(prefill);
  }
})();

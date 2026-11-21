document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.querySelector('[data-search-form]');
  const books = [...document.querySelectorAll('[data-book-card]')];
  const emptyState = document.querySelector('.book-grid__empty');

  if (!searchForm || books.length === 0) {
    return;
  }

  const input = searchForm.querySelector('input[type="search"]');
  const select = searchForm.querySelector('select');
  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  function applyFilter() {
    const query = normalize((input?.value || '').trim());
    const category = (select?.value || 'all');
    let visibleCount = 0;

    books.forEach((book) => {
      const title = normalize(book.dataset.title || '');
      const author = normalize(book.dataset.author || '');
      const bookCategory = normalize(book.dataset.category || '');
      const matchesQuery = !query || title.includes(query) || author.includes(query) || bookCategory.includes(query);
      const matchesCategory = category === 'all' || bookCategory === normalize(category);
      const visible = matchesQuery && matchesCategory;

      book.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  }

  input?.addEventListener('input', applyFilter);
  select?.addEventListener('change', applyFilter);
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilter();
  });

  applyFilter();
});

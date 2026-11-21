(function () {
  const actions = document.querySelector('.book-detail-actions');
  if (!actions) return;

  const message = actions.querySelector('.book-detail-action-message');
  const bookId = actions.closest('[data-book-id]').dataset.bookId;

  async function submit(button, request) {
    const originalLabel = button.textContent;
    message.hidden = true;
    button.disabled = true;
    button.textContent = 'Đang xử lý...';

    try {
      await request();
      window.location.reload();
    } catch (error) {
      message.textContent = error.message;
      message.hidden = false;
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  const borrowButton = actions.querySelector('[data-borrow-book]');
  borrowButton?.addEventListener('click', () => submit(
    borrowButton,
    () => window.api.post('/loans/my', { bookId })
  ));

  const returnButton = actions.querySelector('[data-return-book]');
  returnButton?.addEventListener('click', () => submit(
    returnButton,
    () => window.api.patch(
      `/loans/my/${encodeURIComponent(returnButton.dataset.loanId)}/return`,
      { bookId }
    )
  ));
})();

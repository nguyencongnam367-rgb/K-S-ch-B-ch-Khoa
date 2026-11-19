// Hành vi dùng chung cho các trang quản trị: bật/tắt biểu mẫu, chuyển tab, lọc danh sách, xem trước ảnh bìa
(function () {
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();

  // Nút có data-toggle="#id" sẽ ẩn/hiện phần tử đó
  function initToggles() {
    document.querySelectorAll('[data-toggle]').forEach((trigger) => {
      const selector = trigger.dataset.toggle;
      const target = document.querySelector(selector);
      if (!target) return;

      trigger.addEventListener('click', () => {
        const willShow = target.hidden;
        target.hidden = !willShow;
        document.querySelectorAll(`[data-toggle="${selector}"]`).forEach((el) => {
          el.setAttribute('aria-expanded', String(willShow));
        });
        if (willShow) {
          target.querySelector('input:not([hidden]):not([type="file"]), select')?.focus();
        }
      });
    });
  }

  // Thanh tab: [data-tabs] chứa các [data-tab], panel khai báo [data-tab-panel]
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach((list) => {
      const tabs = [...list.querySelectorAll('[data-tab]')];
      const keys = tabs.map((tab) => tab.dataset.tab);

      function show(key) {
        tabs.forEach((tab) => {
          const active = tab.dataset.tab === key;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
        });
        document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
          if (keys.includes(panel.dataset.tabPanel)) {
            panel.hidden = panel.dataset.tabPanel !== key;
          }
        });
      }

      tabs.forEach((tab) => tab.addEventListener('click', () => show(tab.dataset.tab)));
      list.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        const index = tabs.findIndex((tab) => tab.classList.contains('is-active'));
        const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        show(next.dataset.tab);
        next.focus();
      });
    });
  }

  // Lọc trong từng vùng [data-filter-scope]: ô tìm kiếm, nhóm nút lọc, ô chọn
  function initFilters() {
    document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
      const items = [...scope.querySelectorAll('[data-filter-item]')];
      const input = scope.querySelector('[data-filter-input]');
      const chips = [...scope.querySelectorAll('[data-chip-group] .chip')];
      const selects = [...scope.querySelectorAll('[data-filter-select]')];
      const empty = scope.querySelector('[data-filter-empty]');
      const counter = scope.querySelector('[data-filter-count]');
      let activeChip = chips.find((chip) => chip.classList.contains('is-active'))?.dataset.value || 'all';

      function apply() {
        const query = normalize(input?.value);
        let visible = 0;

        items.forEach((item) => {
          const tags = (item.dataset.tags || '').split(' ');
          const matchesChip = activeChip === 'all' || tags.includes(activeChip);
          const matchesQuery = !query || normalize(item.dataset.search).includes(query);
          const matchesSelects = selects.every((select) => {
            const wanted = select.value;
            return !wanted || item.dataset[select.dataset.filterSelect] === wanted;
          });
          const show = matchesChip && matchesQuery && matchesSelects;
          item.hidden = !show;
          if (show) visible += 1;
        });

        if (empty) empty.hidden = visible !== 0;
        if (counter) counter.textContent = `Hiển thị ${visible} ${counter.dataset.filterCount || ''}`.trim();
      }

      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          activeChip = chip.dataset.value;
          chips.forEach((other) => {
            const active = other === chip;
            other.classList.toggle('is-active', active);
            other.setAttribute('aria-pressed', String(active));
          });
          apply();
        });
      });
      input?.addEventListener('input', apply);
      selects.forEach((select) => select.addEventListener('change', apply));
      apply();
    });
  }

  // Nút "Bỏ" trong danh sách sách của phiếu mượn
  function initRemovable() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove]');
      if (button) button.closest('li')?.remove();
    });
  }

  // Khung tải ảnh bìa: kéo thả, kiểm tra loại và dung lượng, xem trước
  function initCoverUpload() {
    document.querySelectorAll('.dropzone').forEach((zone) => {
      const input = zone.querySelector('[data-cover-input]');
      const hint = zone.querySelector('.dropzone__hint');
      if (!input) return;
      const maxSize = 2 * 1024 * 1024;

      function handle(file) {
        zone.classList.remove('has-error');
        if (!file) return;
        if (!/^image\/(jpeg|png)$/.test(file.type) || file.size > maxSize) {
          input.value = '';
          zone.classList.remove('has-image');
          zone.style.backgroundImage = '';
          zone.classList.add('has-error');
          hint.textContent = 'Chỉ nhận ảnh JPG, PNG tối đa 2 MB';
          return;
        }
        hint.textContent = hint.dataset.defaultHint || hint.textContent;
        zone.style.backgroundImage = `url("${URL.createObjectURL(file)}")`;
        zone.classList.add('has-image');
      }

      input.addEventListener('change', () => handle(input.files[0]));
      zone.addEventListener('dragover', (event) => {
        event.preventDefault();
        zone.classList.add('is-dragover');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
      zone.addEventListener('drop', (event) => {
        event.preventDefault();
        zone.classList.remove('is-dragover');
        const file = event.dataTransfer.files[0];
        if (!file) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        handle(file);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initToggles();
    initTabs();
    initFilters();
    initRemovable();
    initCoverUpload();
  });
})();

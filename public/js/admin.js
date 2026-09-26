/* Ekatalog Pribadi — admin dashboard client behavior (no external deps). */
(function () {
  'use strict';

  function toast(message, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0'; el.style.transition = 'opacity .25s';
      setTimeout(function () { el.remove(); }, 260);
    }, 2600);
  }
  window.showToast = toast;

  document.addEventListener('DOMContentLoaded', function () {
    // ---- sidebar toggle (mobile) ----
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var openBtn = document.getElementById('btn-open-sidebar');
    if (openBtn) openBtn.addEventListener('click', function () {
      sidebar.classList.add('open'); overlay.classList.add('open');
    });
    if (overlay) overlay.addEventListener('click', function () {
      sidebar.classList.remove('open'); overlay.classList.remove('open');
    });

    // ---- styled confirm dialog for destructive forms/links ----
    var confirmOverlay = document.getElementById('confirm-overlay');
    var pendingAction = null;
    document.querySelectorAll('form.js-confirm, a.js-confirm').forEach(function (el) {
      el.addEventListener('submit', function (e) { interceptConfirm(e, el); });
      el.addEventListener('click', function (e) { if (el.tagName === 'A') interceptConfirm(e, el); });
    });
    function interceptConfirm(e, el) {
      e.preventDefault();
      document.getElementById('confirm-message').textContent = el.getAttribute('data-message') || 'Apakah Anda yakin ingin melanjutkan?';
      confirmOverlay.classList.add('open');
      pendingAction = el;
    }
    if (confirmOverlay) {
      document.getElementById('confirm-cancel').addEventListener('click', function () {
        confirmOverlay.classList.remove('open'); pendingAction = null;
      });
      document.getElementById('confirm-ok').addEventListener('click', function () {
        confirmOverlay.classList.remove('open');
        if (!pendingAction) return;
        if (pendingAction.tagName === 'FORM') pendingAction.submit();
        else window.location.href = pendingAction.getAttribute('href');
        pendingAction = null;
      });
    }

    // ---- image upload -> base64 dataURL, with preview thumbnails ----
    document.querySelectorAll('[data-image-upload]').forEach(function (dropEl) {
      var input = dropEl.querySelector('input[type=file]');
      var hidden = document.querySelector(dropEl.getAttribute('data-target'));
      var previewGrid = document.querySelector(dropEl.getAttribute('data-preview'));
      var multiple = dropEl.getAttribute('data-multiple') === 'true';
      var maxFiles = parseInt(dropEl.getAttribute('data-max') || '6', 10);

      function currentList() {
        try { return JSON.parse(hidden.value || '[]'); } catch (e) { return []; }
      }
      function renderPreview() {
        var list = currentList();
        previewGrid.innerHTML = list.map(function (src, idx) {
          return '<div class="img-thumb"><img src="' + src + '">' +
            (idx === 0 && multiple ? '<div class="main-tag">Utama</div>' : '') +
            '<button type="button" class="rm" data-idx="' + idx + '">&times;</button></div>';
        }).join('');
        previewGrid.querySelectorAll('.rm').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var list2 = currentList();
            list2.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
            hidden.value = JSON.stringify(list2);
            renderPreview();
          });
        });
      }
      dropEl.addEventListener('click', function (e) { if (e.target === dropEl || dropEl.contains(e.target)) input.click(); });
      input.addEventListener('click', function (e) { e.stopPropagation(); });
      input.addEventListener('change', function () {
        var files = Array.from(input.files || []);
        var list = multiple ? currentList() : [];
        var remainingSlots = multiple ? Math.max(0, maxFiles - list.length) : 1;
        files = files.slice(0, remainingSlots || 1);
        var readers = files.map(function (file) {
          return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function () { resolve(reader.result); };
            reader.readAsDataURL(file);
          });
        });
        Promise.all(readers).then(function (results) {
          if (multiple) { list = list.concat(results); } else { list = results; }
          hidden.value = JSON.stringify(list);
          renderPreview();
        });
        input.value = '';
      });
      renderPreview();
    });

    // ---- has-variants toggle on product form ----
    var variantToggle = document.getElementById('toggle-has-variants');
    if (variantToggle) {
      var variantBlock = document.getElementById('variant-block');
      var stockBlock = document.getElementById('simple-stock-block');
      function syncVariantVisibility() {
        var on = variantToggle.checked;
        variantBlock.style.display = on ? 'block' : 'none';
        stockBlock.style.display = on ? 'none' : 'block';
      }
      variantToggle.addEventListener('change', syncVariantVisibility);
      syncVariantVisibility();
    }

    // ---- variant rows add/remove ----
    var addVariantBtn = document.getElementById('btn-add-variant');
    if (addVariantBtn) {
      addVariantBtn.addEventListener('click', function () {
        var tbody = document.getElementById('variant-rows');
        var idx = tbody.children.length;
        var row = document.createElement('tr');
        row.innerHTML =
          '<td><input type="text" name="variant_size[]" placeholder="Contoh: M" required></td>' +
          '<td><input type="number" name="variant_price[]" placeholder="Kosongkan = harga utama" min="0"></td>' +
          '<td><input type="number" name="variant_stock[]" placeholder="0" min="0" value="0" required></td>' +
          '<td><input type="text" name="variant_sku[]" placeholder="SKU varian"></td>' +
          '<td><button type="button" class="rm-variant">Hapus</button></td>';
        row.querySelector('.rm-variant').addEventListener('click', function () { row.remove(); });
        tbody.appendChild(row);
      });
      document.querySelectorAll('.rm-variant').forEach(function (btn) {
        btn.addEventListener('click', function () { btn.closest('tr').remove(); });
      });
    }

    // ---- copy to clipboard (test whatsapp link etc) ----
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        navigator.clipboard && navigator.clipboard.writeText(text).then(function () {
          toast('Berhasil disalin', 'success');
        });
      });
    });

    // ---- simple table search filter (client-side, data-table-search) ----
    document.querySelectorAll('[data-table-search]').forEach(function (input) {
      var tableSel = input.getAttribute('data-table-search');
      var table = document.querySelector(tableSel);
      if (!table) return;
      input.addEventListener('input', function () {
        var term = input.value.toLowerCase();
        table.querySelectorAll('tbody tr').forEach(function (tr) {
          tr.style.display = tr.textContent.toLowerCase().indexOf(term) !== -1 ? '' : 'none';
        });
      });
    });
  });
})();
